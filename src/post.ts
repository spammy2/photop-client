import { User } from ".";
import { Chat } from "./chat";
import { Client } from "./client";
import { DocumentObject } from "./documentobject";

export class Post {
	createdAt: Date;
	text: string;
	likes: number;
	chatCount: number;
	chats: Chat[];
	id: string;
	usersLiked: ({user: User, likedAt: Date, raw: DocumentObject & {Timestamp: number}})[] = []

	private _connected = false;

	_chatListeners: Array<(chat: Chat)=>void> = []
	async onChat(callback: (chat: Chat)=>void) {
		if (!this._connected) {
			console.warn("You need to call Post.connect() before adding listeners.")
			return;
		}
		this._chatListeners.push(callback);
	}

	async connect(){
		this._connected = true;
		this.client.connectChat(this.id);
	}

	async disconnect(){
		this._connected = false;
		this.client.disconnectChat(this.id);
	}

	async chat(text: string): Promise<Chat> {
		return this.client.chat(this.id, text)
	}

	/**
	 * @internal Do not create
	 */
	constructor(public client: Client, public raw: RawPost, public author: User) {
		this.createdAt = new Date(this.raw.Timestamp);
		this.text = raw.Text;
		this.chatCount = raw.Chats || 0;
		this.likes = raw.Likes || 0;
		this.chats = [];
		this.id = raw._id;
	}
}

export interface RawPost extends DocumentObject {
	Chats?: number;
	Likes?: number;
	Text: string;
	UserID: string;
	Timestamp: number;
}
