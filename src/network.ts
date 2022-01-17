import { Chat, RawChat } from "./chat";
import { Post, RawPost } from "./post";
import {
	ClientConfiguration,
	ClientCredentials,
	DocumentObject,
	ReqTask,
	SocketResponse,
} from "./types";
import {
	AccountData,
	ClientUser,
	RawUser,
	SignInAccountData,
	User,
} from "./user";

import { WebSocket } from "ws";

import SimpleSocket from "./vendor/simplesocket";

const SOCKET_URL = "wss://api.photop.live/Server1";
const FINGERPRINT = "25010157537369604664110537365900144030";
const IMAGE_UPLOAD_URL = "https://api.photop.live:3000/ImageUpload";

export class Network {
	readonly socket: WebSocket;
	readonly simpleSocket = SimpleSocket;
	//readonly newPosts: Record<string, boolean> = {};
	readonly awaitingMessages: Record<
		string,
		(result: SocketResponse<any>) => void
	> = {};

	posts: Record<string, Post> = {};
	chats: Record<string, Chat> = {};
	users: Record<string, User> = {};

	authtoken?: string;
	userid?: string;
	connectedChats: string[] = [];

	user?: ClientUser;

	chatDelay: number;

	onPost = (post: Post) => {};
	onReady = () => {};

	async post(text: string, medias: any[], configuration: []) {
		const body: any = {
			Text: text,
			Configuration: configuration,
			Media: {},
		};
		if (medias.length > 0) {
			body.Media.ImageCount = medias.length;
		}

		const response = await this.message<{ NewPostID: string }>(
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
						Fingerprint: FINGERPRINT,
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

		await this.getPosts();
		return this.posts[response.Body.NewPostID];
	}

	async getPosts(amount: number = 15, before?: number, initial = false) {
		const response = await this.message<{
			Posts: RawPost[];
			Users: RawUser[];
			Likes: (DocumentObject & {
				Timestamp: number;
			})[];
		}>("GetPosts", {
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
					this.onPost(post);
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

	async connectChat(postid: string) {
		this.connectedChats.push(postid);
		// no idea why they are separate but not something we care about
		const response = await this.message<{
			Chats: RawChat[];
			Users: RawUser[];
		}>("ConnectLiveChat", {
			Amount: 25,
			Posts: this.connectedChats,
			ChatPosts: this.connectedChats,
		});

		this.processUsers(response.Body.Users);
		this.processChats(response.Body.Chats);
	}

	async disconnectChat(postid: string) {
		this.connectedChats = this.connectedChats.filter((id) => id !== postid);
	}

	processUsers(rawUsers: RawUser[]) {
		for (const rawUser of rawUsers) {
			if (rawUser._id in this.users) {
				this.users[rawUser._id].update(rawUser);
			} else {
				this.users[rawUser._id] = new User(this, rawUser);
			}
		}
	}

	async reply(postid: string, replyid: string, text: string) {
		return new Promise<Chat>((res, rej) => {
			this.chatQueue.push({ postid, replyid, text, res, rej });
			if (!this.isProcessing) {
				this.next();
			}
		});
	}

	async chat(postid: string, text: string) {
		return new Promise<Chat>((res, rej) => {
			this.chatQueue.push({ postid, text, res, rej });
			if (!this.isProcessing) {
				this.next();
			}
		});
	}

	chatQueue: {
		postid: string;
		replyid?: string;
		text: string;
		res: (chat: Chat) => void;
		rej: (msg: string) => void;
	}[] = [];
	isProcessing = false;

	private next() {
		const first = this.chatQueue.shift();
		if (first) {
			this.isProcessing = true;
			this._chat(first.text, first.postid, first.replyid)
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
		replyid?: string
	): Promise<Chat> {
		if (text === "") {
			throw new Error("Can't send empty messages");
		}

		const response = await this.message<{
			Message: string;
			NewChatID: string;
		}>("CreateChat", {
			PostID: postid,
			...(replyid ? { ReplyID: replyid } : {}),
			Text: text,
		});

		return new Chat(this, this.user!, this.posts[postid], {
			Text: text,
			_id: response.Body.NewChatID,
			UserID: this.userid!,
			ReplyID: replyid,
			PostID: postid,
			Timestamp: 0, // the response for CreateChat does not include the timestamp, so we must wait for NewChatReceive in order to
		});
	}

	processChats(rawChats: RawChat[]) {
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

				this.posts[rawChat.PostID].chats.push(chat);
				this.chats[rawChat._id] = chat;
			}
		}
		//we do it again because some of the chats may be registered before the ones they are replying to are
		for (const rawChat of rawChats) {
			if (rawChat.ReplyID) {
				this.chats[rawChat._id].replyTo = this.chats[rawChat.ReplyID];
			}
		}
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
		this.user = new ClientUser(this, response.Body);
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
				await this.message<{
					UserData: AccountData;
				}>("GetAccountData");
			} else {
				console.warn(
					"Credentials were provided but they are not username-password or token-userid. Falling back to 'guest' mode"
				);
			}
		}
		await this.getPosts(undefined, undefined, true);

		this.onReady();
	}

	private reqid = 0;
	message<Body>(task: ReqTask, body?: any): Promise<SocketResponse<Body>> {
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
					Fingerprint: FINGERPRINT,
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
		this.simpleSocket.connect({
			project_id: "61b9724ea70f1912d5e0eb11",
			client_token: "client_a05cd40e9f0d2b814249f06fbf97fe0f1d5",
		});
		this.simpleSocket.subscribeEvent<{
			Type: "NewPostAdded" | "JoinGroup" | "LeaveGroup";
		}>({ Task: "GeneralUpdate", Location: "Home" }, (Data) => {
			if (config?.logSocketMessages) console.log(Data);
			if (Data.Type === "NewPostAdded") {
				const NewPostData = (
					Data as unknown as {
						NewPostData: DocumentObject & {
							UserID: string;
							Timestamp: number;
						};
					}
				).NewPostData;

				//this.newPosts[NewPostData._id] = true;

				this.getPosts();
			}
		});
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
					const { Users, Chats } = (
						message as SocketResponse<{
							Chats: RawChat[];
							Users: RawUser[];
						}>
					).Body;

					this.processUsers(Users);

					this.processChats(Chats);
					for (const rawChat of Chats) {
						this.posts[rawChat.PostID]._onChat(
							this.chats[rawChat._id]
						);
					}
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
		this.socket.onopen = () => {
			this._init(credentials);
		};
	}
}
