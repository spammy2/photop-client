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
	usersLiked: {
		user: User;
		likedAt: Date;
		raw: DocumentObject & { Timestamp: number };
	}[] = [];

	private _connected = false;
	private _currentConnection = 0;

	_onChat(chat: Chat) {
		if (this._connected) {
			this.onChat(chat);
		}
	}

	/**
	 * Subscribe to when a chat is made. Use `Post.connect()` before subscribing.
	 */
	onChat = (chat: Chat) => {};

	/**
	 * Start listening to chats from this post
	 */
	async connect(): Promise<void>;

	/**
	 * Start listening to chats from this post
	 * @param disconnectAfter Specifies how long in milliseconds to wait before disconnecting.
	 * @param onDisconnect Called when disconnected automatically
	 * @returns setBack function that allows you to set the disconnect time back.
	 */
	async connect(
		disconnectAfter: number,
		onDisconnect: () => void
	): Promise<() => void>;
	async connect(
		disconnectAfter?: number,
		onDisconnect?: () => void
	): Promise<any> {
		let connection = ++this._currentConnection;
		this._connected = true;
		this._network.connectChat(this.id);
		if (disconnectAfter) {
			let timer = setTimeout(() => {
				if (this._connected && connection === this._currentConnection) {
					this.disconnect();
					if (onDisconnect) onDisconnect();
				}
			}, disconnectAfter);
			return () => {
				if (this._connected) timer.refresh();
			};
		}
	}

	/**
	 * Stop listening to chats from this post
	 */
	async disconnect() {
		this._connected = false;
		this._network.disconnectChat(this.id);
	}

	/**
	 * Likes a post. The like count will not be updated.
	 */
	async like() {
		return this._network.message("LikePost", { PostID: this.id });
	}

	/**
	 * Unlikes a post. The like count will not be updated.
	 */
	async unlike() {
		return this._network.message("UnlikePost", { PostID: this.id });
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
		return this._network.message("UpdatePost", {
			Task: "Delete",
			PostID: this.id,
		});
	}

	/**
	 * Pins a post. Can only pin your own.
	 */
	async pin() {
		return this._network.message("UpdatePost", {
			Task: "PinProfile",
			PostID: this.id,
		});
	}

	/**
	 * Pins a post. Can only unpin your own.
	 */
	async unpin() {
		return this._network.message("UpdatePost", {
			Task: "UnpinProfile",
			PostID: this.id,
		});
	}

	/**
	 * @internal Do not create
	 */
	constructor(
		private _network: Network,
		public raw: RawPost,
		public author: User
	) {
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
