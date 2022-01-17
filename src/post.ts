import { decode } from "html-entities";
import { User } from ".";
import { Chat } from "./chat";
import { Network } from "./network";
import { DocumentObject } from "./types";

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

	/**
	 * Subscribe to when a chat is made. Use `Post.connect()` before subscribing.
	 */
	async onChat(callback: (chat: Chat)=>void) {
		if (!this._connected) {
			console.warn("You need to call Post.connect() before adding listeners.")
			return;
		}
		this._chatListeners.push(callback);
	}

	/**
	 * Start listening to chats from this post
	 */
	async connect(){
		this._connected = true;
		this._network.connectChat(this.id);
	}

	/**
	 * Stop listening to chats from this post
	 */
	async disconnect(){
		this._connected = false;
		this._network.disconnectChat(this.id);
	}

	/**
	 * Likes a post. The like count will not be updated.
	 */
	async like(){
		return this._network.message("LikePost", {PostID: this.id})
	}

	/**
	 * Unlikes a post. The like count will not be updated.
	 */
	async unlike(){
		return this._network.message("UnlikePost", {PostID: this.id})
	}

	/**
	 * Creates a chat on the target post. 
	 */
	async chat(text: string): Promise<Chat> {
		return this._network.chat(this.id, text);
	}

	/**
	 * Deletes a post.
	 * Warning: you can only delete your only posts.
	 * This will error if it isn't your post.
	 */
	async delete() {
		return this._network.message("UpdatePost", { Task: "Delete", PostID: this.id})
	}

	/**
	 * Pins a post. Can only pin your own.
	 */
	async pin(){
		return this._network.message("UpdatePost", { Task: "PinProfile", PostID: this.id})
	}	

	/**
	 * Pins a post. Can only unpin your own.
	 */
	async unpin(){
		return this._network.message("UpdatePost", { Task: "UnpinProfile", PostID: this.id})
	}

	/**
	 * @internal Do not create
	 */
	constructor(private _network: Network, public raw: RawPost, public author: User) {
		this.createdAt = new Date(this.raw.Timestamp);
		this.text = decode(raw.Text);
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
