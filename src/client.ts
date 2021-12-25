import { Chat, RawChat } from "./chat";
import { DocumentObject } from "./documentobject";
import { Post, RawPost } from "./post";
import FormData from "form-data"
import {
	AccountData,
	ClientUser,
	RawUser,
	SignInAccountData,
	User,
} from "./user";
import WebSocket from "ws";
import fetch from "node-fetch"

const SOCKET_URL = "wss://api.photop.live/Server1";
const IMAGE_UPLOAD_URL = "https://api.photop.live:3000/ImageUpload";

/**
 * Represents a Photop client
 * Provides an interface of interactions that can be done by the user.
 */
export class Client {
	private readonly _socket: WebSocket;

	private readonly awaitingMessages: Record<
		string,
		(result: SocketResponse<any>) => void
	> = {};

	private _reqid = 0;
	chatDelay: number | undefined;
	private _message<Body>(
		task: ReqTask,
		body?: any
	): Promise<SocketResponse<Body>> {
		return new Promise((res, rej) => {
			const message = {
				Body: body,
				Metadata: {
					...(this._authtoken
						? {
								AuthToken: this._authtoken,
								UserID: this._userid,
						  }
						: {}),
					ReqID: this._reqid,
					ReqTask: task,
					// After careful review from Photop Client staff, we have determined that fingerprint is very useless
					// The length is completely arbitrary and we can substitute this for a random number generator
					Fingerprint: this.fingerprint,
				},
			};

			if (this.logSocketMessages) {
				console.log("SEND", message);
			}

			this._socket.send(JSON.stringify(message));

			this.awaitingMessages[this._reqid] = (
				result: SocketResponse<Body>
			) => {
				if (result.Body.Code !== 200) {
					rej(result.Body.Message);
				} else {
					res(result);
				}
			};
			this._reqid++;
		});
	}

	private _authtoken?: string;
	private _userid?: string;

	private _posts: Record<string, Post> = {};
	private _chats: Record<string, Chat> = {};
	private _users: Record<string, User> = {};

	private _processUsers(rawUsers: RawUser[]) {
		for (const rawUser of rawUsers) {
			if (rawUser._id in this._users) {
				this._users[rawUser._id].update(rawUser);
			} else {
				this._users[rawUser._id] = new User(this, rawUser);
			}
		}
	}
	private _processChats(rawChats: RawChat[]) {
		for (const rawChat of rawChats) {
			if (rawChat._id in this._chats) {
				this._chats[rawChat._id].update(rawChat);
			} else {
				const chat = new Chat(
					this,
					this._users[rawChat.UserID],
					this._posts[rawChat.PostID],
					rawChat
				);
				
				this._posts[rawChat.PostID].chats.push(chat);
				this._chats[rawChat._id] = chat;
			}
		}
		//we do it again because some of the chats may be registered before the ones they are replying to are
		for (const rawChat of rawChats) {
			if (rawChat.ReplyID) {
				this._chats[rawChat._id].replyTo = this._chats[rawChat.ReplyID];
			}
		}
	}

	private async _init(credentials?: Credentials) {
		let a = await this._message("CreateConnection");
		if (credentials) {
			if ("username" in credentials) {
				await this.authenticate(
					credentials.username,
					credentials.password
				);
			} else if ("token" in credentials) {
				this._authtoken = credentials.token;
				this._userid = credentials.userid;
				await this._getAccountData();
			} else {
				console.warn(
					"Credentials were provided but they are not username-password or token-userid. Falling back to 'guest' mode"
				);
			}
		}
		await this._getPosts(undefined, undefined, true);

		this._readyListeners.forEach((callback) => {
			callback();
		});
	}

	private async _getPosts(amount: number = 15, before?: number, initial=false) {
		const response = await this._message<{
			Posts: RawPost[];
			Users: RawUser[];
			Likes: (DocumentObject & {
				Timestamp: number;
			})[];
		}>("GetPosts", {
			Amount: amount,
			...(before ? { Before: before } : {}),
		});

		this._processUsers(response.Body.Users);

		const posts = response.Body.Posts.map((rawPost) => {
			return new Post(this, rawPost, this._users[rawPost.UserID]);
		});
		for (const post of posts) {
			if (!(post.id in this._posts)) {
				this._posts[post.id] = post;
				if (!initial) {
					this._postListeners.forEach((listener) => {
						listener(post);
					});
				}
			}
		}

		if (Array.isArray(response.Body.Likes)) {
			for (const like of response.Body.Likes) {
				const postid = like._id.substring(0, posts[0].id.length);
				const userid = like._id.substring(postid.length);
				this._posts[postid].usersLiked.push({
					user: this._users[userid],
					raw: like,
					likedAt: new Date(like.Timestamp),
				});
			}
		}

		return posts;
	}

	private readonly _postListeners: Array<(post: Post) => void> = [];
	private readonly _newPosts: Record<string, boolean> = {};

	readonly logSocketMessages: boolean;

	// fingerprint is so mysterious changing one value breaks it but leaving it like this works???
	// i'm honestly confused but i dont care anymore
	fingerprint: string = "25010157537369604664110537365900144030";

	async post(text: string, medias: Blob[] = [], configuration: [] = []) {
		const body: any = {
			Text: text,
			Configuration: configuration,
			Media: {},
		};
		if (medias.length > 0) {
			body.Media.ImageCount = medias.length;
		}

		const response = await this._message<{ NewPostID: string }>(
			"CreatePost",
			body
		);

		if (medias.length>0){
			const data = new FormData();
			data.append(
				"RequestData",
				JSON.stringify({
					AccountData: {
						AuthToken: this._authtoken,
						UserID: this._userid,
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

		await this._getPosts();
		return this._posts[response.Body.NewPostID]
	}

	/** debug purposes only. not practical */
	getPostFromCache(id: string) {
		return this._posts[id];
	}

	/**
	 * Handle posts here
	 * @example
	 * client.onPost((post)=>{
	 * 	post.chat("Hello");
	 * })
	 */
	onPost(callback: (post: Post) => void) {
		this._postListeners.push(callback);
	}

	private readonly _errorListeners: Array<(message: string) => void> = [];
	/**
	 * Errors such as authorization errors will be outputted here
	 */
	onError(callback: (message: string) => void) {
		this._errorListeners.push(callback);
	}

	private readonly _readyListeners: Array<() => void> = [];
	onReady(callback: () => void) {
		this._readyListeners.push(callback);
	}

	private async _getAccountData() {
		const response = await this._message<{
			UserData: AccountData;
		}>("GetAccountData");
	}

	user?: ClientUser;

	private _chatQueue: {postid: string, replyid?: string, text: string, res: (chat: Chat)=>void, rej: (msg: string)=>void}[] = [];
	private _isProcessing = false;
	private next(){
		const first = this._chatQueue.shift()
		if (first) {
			this._isProcessing = true;
			this._chat(first.text, first.postid, first.replyid).then(chat=>{
				first.res(chat);
				setTimeout(this.next.bind(this), this.chatDelay)
			})
		} else {
			this._isProcessing = false;
		}
	}

	private async _chat(text: string, postid: string, replyid?: string): Promise<Chat> {
		const response = await this._message<{
			Message: string;
			NewChatID: string;
		}>("CreateChat", {
			PostID: postid,
			...(replyid? {ReplyID: replyid}: {}),
			Text: text,
		});

		return new Chat(this, this.user!, this._posts[postid], {
			Text: text,
			_id: response.Body.NewChatID,
			UserID: this.user!.id,
			ReplyID: replyid,
			PostID: postid,
			Timestamp: 0, // the response for CreateChat does not include the timestamp, so we must wait for NewChatReceive in order to
		});
	}

	async reply(postid: string, replyid: string, text: string){
		return new Promise<Chat>((res, rej)=>{
			this._chatQueue.push({postid, replyid, text, res, rej});
			if (!this._isProcessing) {
				this.next();
			}
		})
	}

	async chat(postid: string, text: string){
		return new Promise<Chat>((res, rej)=>{
			this._chatQueue.push({postid, text, res, rej});
			if (!this._isProcessing) {
				this.next();
			}
		})
	}

	private _connectedChats: string[] = [];
	async connectChat(postid: string) {
		this._connectedChats.push(postid);
		// no idea why they are separate but not something we care about
		const response = await this._message<{Chats: RawChat[], Users: RawUser[]}>("ConnectLiveChat", {
			Amount: 25,
			Posts: this._connectedChats,
			ChatPosts: this._connectedChats,
		});

		this._processUsers(response.Body.Users)
		this._processChats(response.Body.Chats);
	}
	async disconnectChat(postid: string){
		this._connectedChats = this._connectedChats.filter(id=>id!==postid)
	}

	async authenticate(username: string, password: string) {
		const response = await this._message<SignInAccountData>(
			"SignInAccount",
			{
				Username: username,
				Password: password,
			}
		);
		this._userid = response.Body.UserID;
		this._authtoken = response.Body.Token;
		this.user = new ClientUser(this, response.Body);
	}

	async likePost(postid: string) {
		await this._message("LikePost", { PostID: postid });
	}

	/**
	 * Sign out.
	 */
	async signout() {
		const body = (await this._message("LogoutAccount")).Body;

		this.user = undefined;
		this._userid = undefined;
		this._authtoken = undefined;

		return body;
	}

	/**
	 *
	 * @param authtoken
	 */
	constructor(credentials?: Credentials, configuration?: Configuration) {
		this.logSocketMessages = configuration?.logSocketMessages || false;
		this.chatDelay = configuration?.chatDelay || 1000;
		this._socket = new WebSocket(SOCKET_URL);
		this._socket.onmessage = (rawMessage) => {
			if (rawMessage.data === "pong") return;
			const message: SocketResponse<unknown> = JSON.parse(
				rawMessage.data.toString()
			);

			if (this.logSocketMessages) {
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
				if (message.Body.ClientFunction === "DisplayNewPostMessage") {
					const NewPostData = (
						message as SocketResponse<{
							NewPostData: DocumentObject & {
								UserID: string;
								Text: string;
							};
						}>
					).Body.NewPostData;
					this._newPosts[NewPostData._id] = true;

					this._getPosts();
				} else if (message.Body.ClientFunction === "NewChatRecieve") {
					const { Users, Chats } = (
						message as SocketResponse<{
							Chats: RawChat[];
							Users: RawUser[];
						}>
					).Body;

					this._processUsers(Users);

					this._processChats(Chats);
					for (const rawChat of Chats) {
						this._posts[rawChat.PostID]._chatListeners.forEach((callback)=>{
							callback(this._chats[rawChat._id])
						})
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
		this._socket.onopen = () => {
			this._init(credentials);
		};
	}

}

type Credentials =
	| { username: string; password: string }
	| { token: string; userid: string };
interface Configuration {
	logSocketMessages?: boolean;
	chatDelay?: number;
}

interface SocketResponse<body> {
	Body: body & {
		Code: number;
		Message: string;
		ClientFunction?: ClientFunction;
	};
	Metadata: {
		ReqSource: "Client" | "Server";
		SentMetadata: {
			ReqID: number;
			ReqTask: ReqTask;
		};
	};
}

type ReqTask =
	| "CreateConnection"
	| "GetAccountData"
	| "GetPosts"
	| "ConnectLiveChat"
	| "GetLiveCount"
	| "LoadPlatformEmbeds"
	| "SignInAccount"
	| "LogoutAccount"
	| "CreateChat"
	| "LinkPreview"
	| "GetProfile"
	| "UpdateAccountData"
	| "LikePost"
	| "CreatePost";

// Lmao robot_engine spelled 'receive' wrong and made it error
type ClientFunction = "DisplayNewPostMessage" | "NewChatRecieve";
