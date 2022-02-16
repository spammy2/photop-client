import { Group } from "./group";
import { Network } from "./network";
import { Post } from "./post";
import { BaseObject, DocumentObject } from "./types";
import { User } from "./user";
export declare class Chat implements BaseObject {
    private _network;
    post: Post;
    raw: RawChat;
    timestamp: number;
    createdAt: Date;
    id: string;
    text: string;
    author: User;
    /**
     * @deprecated Use Chat.author for consistency with Post.author
     */
    user: User;
    /** The chat this this chat is replying to. */
    replyTo?: Chat;
    /** The group that this chat is part of. Undefined if not part of any group. */
    group?: Group;
    /**
     * @private
     * Update is for when some values are unknown at instantiation time
     */
    update(raw: RawChat): void;
    /** Replies to a specific chat message */
    reply(text: string): void;
    /** Called when it has been detected that this chat is deleted. */
    onDeleted: () => void;
    constructor(_network: Network, user: User, post: Post, raw: RawChat, replyTo?: Chat);
}
export interface RawChat extends DocumentObject {
    PostID: string;
    ReplyID?: string;
    GroupID?: string;
    Text: string;
    UserID: string;
    Timestamp: number;
}
