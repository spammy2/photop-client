import { decode } from "html-entities";
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
		this.client.connectChat(this.id);
	}

	/**
	 * Stop listening to chats from this post
	 */
	async disconnect(){
		this._connected = false;
		this.client.disconnectChat(this.id);
	}

	/**
	 * Likes a post. The like count will not be updated.
	 */
	async like(){
		return this.client.likePost(this.id);		
	}

	/**
	 * Unlikes a post. The like count will not be updated.
	 */
	async unlike(){
		return this.client.unlikePost(this.id);
	}

	/**
	 * Creates a chat on the target post. 
	 */
	async chat(text: string): Promise<Chat> {
		return this.client.chat(this.id, text)
	}

	/**
	 * Deletes a post.
	 * Warning: you can only delete your only posts.
	 * This will error if it isn't your post.
	 */
	async delete() {
		return this.client.deletePost(this.id);
	}

	/**
	 * Pins a post. Can only pin your own.
	 */
	async pin(){
		return this.client.pinPost(this.id);
	}	

	/**
	 * Pins a post. Can only unpin your own.
	 */
	async unpin(){
		return this.client.unpinPost(this.id);
	}

	/**
	 * @internal Do not create
	 */
	constructor(public client: Client, public raw: RawPost, public author: User) {
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
