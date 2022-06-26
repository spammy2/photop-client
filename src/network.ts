import { Chat, RawChat } from "./chat";
import { Post, RawPost } from "./post";
import {
	ChatId,
	ClientConfiguration,
	ClientCredentials,
	DocumentObject,
	GroupId,
	GroupInviteData,
	PostId,
	ReqTask,
	SocketResponse,
	UserId,
} from "./types";
import { AccountData, SignInAccountData } from "./clientusertypes";
import { ClientUser } from "./clientuser";
import { WebSocket } from "ws";
import SimpleSocket, { Subscription } from "./vendor/simplesocket";
import { Group, RawGroup, RawGroupJoin } from "./group";
import { RawGroupUser } from "./groupuser";
import { RawUser } from "./usertypes";
import { User } from "./user";

const SOCKET_URL = "wss://phosocket.exotek.co/Server1";
const IMAGE_UPLOAD_URL = "https://api.photop.live:3000/ImageUpload";

export class Network {
	socket: WebSocket;
	readonly simpleSocket: SimpleSocket;
	//readonly newPosts: Record<string, boolean> = {};
	readonly awaitingMessages: Record<
		string,
		(result: SocketResponse<any>) => void
	> = {};

	posts: Record<PostId, Post> = {};
	chats: Record<ChatId, Chat> = {};
	users: Record<UserId, User> = {};
	groups: Record<GroupId, Group> = {};

	authtoken?: string;
	userid?: string;
	connectedPosts = new Set<PostId>();

	user?: ClientUser;

	chatDelay: number;

	onInvite = (invite: GroupInviteData) => {};
	onPost = (post: Post) => {};
	onReady = () => {};

	fingerprint = "25010157537369604664110537365900144030"; // useless fingerprint lol

	generalUpdateSub?: Subscription;
	groupInvitesSub?: Subscription;
	postUpdateSub?: Subscription;
	profileUpdate?: Subscription;

	async post(
		text: string,
		groupid: string | undefined,
		medias: any[],
		configuration: []
	) {
		const body: any = {
			Text: text,
			Configuration: configuration,
			Media: {},
		};
		if (groupid) {
			body.GroupID = groupid;
		}
		if (medias.length > 0) {
			body.Media.ImageCount = medias.length;
		}

		const response = await this.message<{ NewPostID: PostId }>(
			"CreatePost",
			body
		);

		if (medias.length > 0) {
			const data = new FormData();
			data.append(
				"RequestData",
				JSON.stringify({
					AccountData: {
						AuthToken: this.authtoken,
						UserID: this.userid,
						Fingerprint: this.fingerprint,
					},
					Metadata: { PostID: response.Body.NewPostID },
				})
			);
			for (let i = 0; i < medias.length; i++) {
				data.append(`File${i}`, medias[i]);
			}
			await fetch(IMAGE_UPLOAD_URL, {
				method: "POST",
				body: data,
			});
		}

		await this.getPosts({ groupid });
		return this.posts[response.Body.NewPostID];
	}

	async getPosts({
		amount = 15,
		groupid,
		before,
		userid,
		initial,
	}: Partial<GetPostsQuery>) {
		const response = await this.message<{
			Posts: RawPost[];
			Users: RawUser[];
			Likes: (DocumentObject & {
				Timestamp: number;
			})[];
		}>("GetPosts", {
			...(groupid ? { GroupID: groupid } : {}),
			...(userid ? { FromUserID: userid } : {}),
			Amount: amount,
			...(before ? { Before: before } : {}),
		});

		this.processUsers(response.Body.Users);

		const posts = response.Body.Posts.map((rawPost) => {
			return new Post(this, rawPost, this.users[rawPost.UserID]);
		});
		for (const post of posts) {
			if (!(post.id in this.posts)) {
				this.posts[post.id] = post;
				if (!initial) {
					// if (groupid) {
					// 	this.groups[groupid].onPost(post);
					// } else {
					this.onPost(post);
					// }
				}
			}
		}

		if (Array.isArray(response.Body.Likes)) {
			for (const like of response.Body.Likes) {
				const postid = like._id.substring(0, posts[0].id.length);
				const userid = like._id.substring(postid.length);
				this.posts[postid].usersLiked.push({
					user: this.users[userid],
					raw: like,
					likedAt: new Date(like.Timestamp),
				});
			}
		}

		return posts;
	}

	async connectChat(postid: PostId) {
		this.connectedPosts.add(postid);
		if (this.postUpdateSub) {
			this.postUpdateSub,({
				Task: "PostUpdate",
				_id: Array.from(this.connectedPosts),
			});
		}

		const response = await this.message<{
			Chats: RawChat[];
			Users: RawUser[];
		}>("ConnectLiveChat", {
			SimpleSocketID: this.simpleSocket.secureID,
			Amount: 25,
			Posts: Array.from(this.connectedPosts),
			ChatPosts: Array.from(this.connectedPosts),
		});

		this.processUsers(response.Body.Users);
		this.processChats(response.Body.Chats);
	}

	async disconnectChat(postid: string) {
		this.connectedPosts.delete(postid);
	}

	processUsers(rawUsers: RawUser[]) {
		let processed: User[] = [];
		for (const rawUser of rawUsers) {
			if (rawUser._id in this.users) {
				this.users[rawUser._id].updateRaw(rawUser);
			} else {
				this.users[rawUser._id] = User.FromRaw(this, rawUser);
			}
			processed.push(this.users[rawUser._id]);
		}
		return processed;
	}

	async reply(
		text: string,
		postid: string,
		replyid: string,
		groupid?: string
	) {
		return new Promise<Chat>((res, rej) => {
			this.chatQueue.push({ postid, replyid, groupid, text, res, rej });
			if (!this.isProcessing) {
				this.next();
			}
		});
	}

	async chat(text: string, postid: string, groupid?: string) {
		return new Promise<Chat>((res, rej) => {
			this.chatQueue.push({ postid, text, res, rej, groupid });
			if (!this.isProcessing) {
				this.next();
			}
		});
	}

	chatQueue: {
		postid: string;
		replyid?: string;
		groupid?: string;
		text: string;
		res: (chat: Chat) => void;
		rej: (msg: string) => void;
	}[] = [];
	isProcessing = false;

	private next() {
		const first = this.chatQueue.shift();
		if (first) {
			this.isProcessing = true;
			this._chat(first.text, first.postid, first.replyid, first.groupid)
				.then((chat) => {
					first.res(chat);
					setTimeout(this.next.bind(this), this.chatDelay);
				})
				.catch(() => {
					console.log("Error: Throttled?");
					setTimeout(this.next.bind(this), this.chatDelay);
				});
		} else {
			this.isProcessing = false;
		}
	}

	private async _chat(
		text: string,
		postid: string,
		replyid?: string,
		groupid?: string
	): Promise<Chat> {
		if (text === "") {
			throw new Error("Can't send empty messages");
		}

		const response = await this.message<{
			Message: string;
			NewChatID: string;
		}>("CreateChat", {
			GroupID: groupid,
			PostID: postid,
			ReplyID: replyid,
			Text: text,
		});

		return new Chat(this, this.user!, this.posts[postid], {
			Text: text,
			_id: response.Body.NewChatID,
			GroupID: groupid,
			UserID: this.userid!,
			ReplyID: replyid,
			PostID: postid,
			Timestamp: 0, // the response for CreateChat does not include the timestamp, so we must wait for NewChatReceive in order to
		});
	}

	/**
	 *
	 * @param rawChats RawChats
	 * @param autosort Whether a post's chats should be automatically sorted afterwards
	 * DOES NOT MUTATE Post.chats. Do it yourself.
	 */
	processChats(rawChats: RawChat[], autosort = true) {
		const processed: Chat[] = [];
		for (const rawChat of rawChats) {
			if (rawChat._id in this.chats) {
				this.chats[rawChat._id].update(rawChat);
			} else {
				const chat = new Chat(
					this,
					this.users[rawChat.UserID],
					this.posts[rawChat.PostID],
					rawChat
				);

				//this.posts[rawChat.PostID].chats.push(chat);
				this.chats[rawChat._id] = chat;
			}
			processed.push(this.chats[rawChat._id]);
		}
		//we do it again because some of the chats may be registered before the ones they are replying to are
		for (const rawChat of rawChats) {
			if (rawChat.ReplyID) {
				this.chats[rawChat._id].replyTo = this.chats[rawChat.ReplyID];
			}
		}
		return processed;
	}

	async authenticate(username: string, password: string) {
		const response = await this.message<SignInAccountData>(
			"SignInAccount",
			{
				Username: username,
				Password: password,
			}
		);
		this.userid = response.Body.UserID;
		this.authtoken = response.Body.Token;
		this.user = ClientUser.FromSignIn(this, response.Body);

		if (!this.config?.disableGroups) {
			for (const [groupid, rawGroup] of Object.entries(
				response.Body.Groups || []
			)) {
				this.groups[groupid] = new Group(this, {
					...rawGroup,
					_id: groupid,
				});
				await this.groups[groupid].onReadyPromise;
			}
		}

		if (this.generalUpdateSub) {
			this.generalUpdateSub.edit({
				Task: "GeneralUpdate",
				Location: "Home",
				Groups: Object.keys(this.groups),
				UserID: this.userid,
			});
		}

		if (this.groupInvitesSub) {
			this.groupInvitesSub.edit({
				Task: "NewGroupInvite",
				UserID: this.userid,
			});
		}
	}

	onGroupsChanged() {
		if (this.generalUpdateSub) {
			this.generalUpdateSub.edit({
				Task: "GeneralUpdate",
				Location: "Home",
				Groups: Object.keys(this.groups),
				UserID: this.userid!,
			});
		}
	}

	private async _init(credentials?: ClientCredentials) {
		let a = await this.message("CreateConnection");
		if (credentials) {
			if ("username" in credentials) {
				await this.authenticate(
					credentials.username,
					credentials.password
				);
			} else if ("token" in credentials) {
				this.authtoken = credentials.token;
				this.userid = credentials.userid;
				this.fingerprint = credentials.fingerprint;
				await this.message<{
					UserData: AccountData;
				}>("GetAccountData");
			} else {
				console.warn(
					"Credentials were provided but they are not username-password or token-userid. Falling back to 'guest' mode"
				);
			}
		}
		await this.getPosts({ initial: true });

		if (this.config?.disableGroups !== true) {
			this.groupInvitesSub = this.simpleSocket.subscribe(
				{ Task: "NewGroupInvite", UserID: this.userid },
				(Data: GroupInviteData) => {
					this.onInvite(Data);
				}
			);
			if (credentials && "token" in credentials) {
				const getGroupsResponse = await this.message<{
					Invites: string[];
					Groups: RawGroup[];
					JoinedArr: RawGroupJoin[];
					Owners: RawGroupUser[];
				}>("GetGroups", {});

				// Body.Owners is unnecessary because we are already fetching the members of the group;
				// this.processUsers(getGroupsResponse.Body.Owners);
				for (const rawGroup of getGroupsResponse.Body.Groups) {
					this.groups[rawGroup._id] = new Group(this, rawGroup);
					await this.groups[rawGroup._id].onReadyPromise;
				}
			}
		}

		//this.profileUpdate = this.simpleSocket.subscribeEvent()

		this.postUpdateSub = this.simpleSocket.subscribe<
			| {
					Type: "LikeCounter";
					_id: string;
					Change: number;
			  }
			| {
					Type: "DeletePost";
					_id: string;
			  }
		>(
			{
				Task: "PostUpdate",
				_id: Array.from(this.connectedPosts), //which is an empty array
			},
			(Data) => {
				if (Data.Type === "LikeCounter") {
					this.posts[Data._id].likesChanged();
				} else if (Data.Type === "DeletePost") {
					this.posts[Data._id].onDeleted();
					for (const chatid in this.chats) {
						this.chats[chatid].onDeleted();
						delete this.chats[chatid];
					}
					delete this.posts[Data._id];
				}
			}
		);

		this.generalUpdateSub = this.simpleSocket.subscribe<{
			Type: "NewPostAdded" | "JoinGroup" | "LeaveGroup";
		}>(
			{
				Task: "GeneralUpdate",
				Location: "Home",
				Groups: Object.keys(this.groups),
				UserID: this.userid,
			},
			(Data) => {
				if (Data.Type === "NewPostAdded") {
					const NewPostData = (
						Data as unknown as {
							NewPostData: DocumentObject & {
								UserID: string;
								Timestamp: number;
								GroupID?: string;
							};
						}
					).NewPostData;

					//this.newPosts[NewPostData._id] = true;
					this.getPosts({ groupid: NewPostData.GroupID });
				} else if (Data.Type === "LeaveGroup") {
				} else if (Data.Type === "JoinGroup") {
				}
			}
		);
		this.onReady();
	}

	private reqid = 0;
	message<Body>(
		task: ReqTask,
		body?: Record<string, undefined | string | number | Array<any>>
	): Promise<SocketResponse<Body>> {
		return new Promise((res, rej) => {
			const message = {
				Body: body,
				Metadata: {
					...(this.authtoken
						? {
								AuthToken: this.authtoken,
								UserID: this.userid,
						  }
						: {}),
					ReqID: this.reqid,
					ReqTask: task,
					// After careful review from Photop Client staff, we have determined that fingerprint is very useless
					// The length is completely arbitrary and we can substitute this for a random number generator
					Fingerprint: this.fingerprint,
				},
			};

			if (this.config?.logSocketMessages) {
				console.log("SEND", message);
			}

			this.socket.send(JSON.stringify(message));

			this.awaitingMessages[this.reqid] = (
				result: SocketResponse<Body>
			) => {
				if (result.Body.Code !== 200) {
					rej(result.Body.Message);
				} else {
					res(result);
				}
			};
			this.reqid++;
		});
	}

	async signout() {
		const body = (await this.message("LogoutAccount")).Body;

		this.user = undefined;
		this.userid = undefined;
		this.authtoken = undefined;

		return body;
	}

	constructor(
		credentials?: ClientCredentials,
		public config?: ClientConfiguration
	) {
		this.chatDelay = config?.chatDelay || 2000;

		this.socket = new WebSocket(SOCKET_URL);
		this.simpleSocket = new SimpleSocket({
			project_id: "61b9724ea70f1912d5e0eb11",
			project_token: "client_a05cd40e9f0d2b814249f06fbf97fe0f1d5",
		});
		this.simpleSocket.showDebug = this.config?.logSocketMessages ?? false;
		this.simpleSocket.remotes.PostStream = (Body) => {
			if (Body.Type == "NewChat") {
				const { Users, Chats } = Body as {
					Chats: RawChat[];
					Users: RawUser[];
				};

				this.processUsers(Users);

				this.processChats(Chats);
				for (const rawChat of Chats) {
					if (this.posts[rawChat.PostID]) {
						this.posts[rawChat.PostID]._onChat(this.chats[rawChat._id]);
					} else {
						console.warn(`photop-client may have subscribed to a post via simplesocket that is unknown to it. POSTID: ${rawChat.PostID}`)
					}
				}
			} else if (Body.Type == "DeleteChat") {
				for (const chatId of Body.ChatIDs) {
					this.chats[chatId].onDeleted();
					delete this.chats[chatId];
				}
			}
		};
		// restart socket if it somehow closes
		this.socket.onclose = () => {
			this.socket = new WebSocket(SOCKET_URL);
		};

		this.socket.onmessage = (rawMessage) => {
			if (rawMessage.data === "pong") return;
			const message: SocketResponse<unknown> = JSON.parse(
				rawMessage.data.toString()
			);

			if (this.config?.logSocketMessages) {
				console.log("RECEIVE", message);
			}

			if (message.Metadata.ReqSource === "Client") {
				this.awaitingMessages[message.Metadata.SentMetadata.ReqID](
					message
				);
				delete this.awaitingMessages[
					message.Metadata.SentMetadata.ReqID
				];
			} else if (message.Metadata.ReqSource === "Server") {
				if (message.Body.ClientFunction === "NewChatRecieve") {
					// const { Users, Chats } = (
					// 	message as SocketResponse<{
					// 		Chats: RawChat[];
					// 		Users: RawUser[];
					// 	}>
					// ).Body;
					// this.processUsers(Users);
					// this.processChats(Chats);
					// for (const rawChat of Chats) {
					// 	this.posts[rawChat.PostID]._onChat(
					// 		this.chats[rawChat._id]
					// 	);
					// }
				} else {
					console.warn(
						"Received a socket message from Server with an unrecognized ClientFunction"
					);
					console.warn({
						rawMessage,
						message,
						ClientFunction: message.Body.ClientFunction,
					});
				}
			}
		};
		let a = 0;
		const ready = ()=>{
			a++;
			if (a===2)
			this._init(credentials);
		}
		this.simpleSocket.socket.onopen = ready;
		this.socket.onopen = ready;
	}
}

export interface GetPostsQuery {
	amount: number;
	before: number;
	userid: string;
	groupid: string;
	initial: true;
}
