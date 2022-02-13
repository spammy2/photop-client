import { User } from ".";
import { Chat } from "./chat";
import { Group } from "./group";
import { Network } from "./network";
import { BaseObject, DocumentObject } from "./types";
export declare class Post implements BaseObject {
    private _network;
    private raw;
    author: User;
    timestamp: number;
    createdAt: Date;
    /** Text of this message */
    text: string;
    /** How many likes this has. Does not update so do not use. */
    likes: number;
    /** Amount of chats this post has. More accurate than using post.chats.length */
    chatCount: number;
    id: string;
    group?: Group;
    usersLiked: {
        user: User;
        likedAt: Date;
        raw: DocumentObject & {
            Timestamp: number;
        };
    }[];
    private _connected;
    private _currentConnection;
    /**
     * Useful if the client was not subscribed to messages and needs to catch up.
     * At the same time it is only for checking history.
     */
    loadChats(): Promise<void>;
    onDeleted: () => void;
    _onChat(chat: Chat): void;
    /**
     * Subscribe to when a chat is made. Use `Post.connect()` before subscribing.
     */
    onChat: (chat: Chat) => void;
    /**
     * Start listening to chats from this post
     */
    connect(): Promise<void>;
    /**
     * Start listening to chats from this post
     * @param disconnectAfter Specifies how long in milliseconds to wait before disconnecting.
     * @param onDisconnect Called when disconnected automatically
     * @returns setBack function that allows you to set the disconnect time back.
     */
    connect(disconnectAfter: number, onDisconnect?: () => void): Promise<() => void>;
    /**
     * Stop listening to chats from this post
     */
    disconnect(): Promise<void>;
    /**
     * Likes a post. The like count will not be updated.
     */
    like(): Promise<import("./types").SocketResponse<unknown>>;
    /**
     * Unlikes a post. The like count will not be updated.
     */
    unlike(): Promise<import("./types").SocketResponse<unknown>>;
    /**
     * Creates a chat on the target post.
     */
    chat(text: string): Promise<Chat>;
    /**
     * Deletes a post.
     * Warning: you can only delete your only posts.
     * This will error if it isn't your post.
     */
    delete(): Promise<import("./types").SocketResponse<unknown>>;
    /**
     * Pins a post. Can only pin your own.
     */
    pin(): Promise<import("./types").SocketResponse<unknown>>;
    /**
     * Pins a post. Can only unpin your own.
     */
    unpin(): Promise<import("./types").SocketResponse<unknown>>;
    /**
     * @internal Do not create
     */
    constructor(_network: Network, raw: RawPost, author: User);
}
export interface RawPost extends DocumentObject {
    Chats?: number;
    Likes?: number;
    GroupID?: string;
    Text: string;
    UserID: string;
    Timestamp: number;
}
