import { Network } from "./network";
import { Post } from "./post";
import { BaseObject, DocumentObject } from "./types";
import { User } from "./user";
export declare class Chat implements BaseObject {
    private _network;
    user: User;
    post: Post;
    raw: RawChat;
    createdAt: Date;
    id: string;
    text: string;
    replyTo?: Chat;
    /**
     * Update is for when some values are unknown at instantiation time
     */
    update(raw: RawChat): void;
    reply(text: string): void;
    constructor(_network: Network, user: User, post: Post, raw: RawChat, replyTo?: Chat);
}
export interface RawChat extends DocumentObject {
    PostID: string;
    ReplyID?: string;
    Text: string;
    UserID: string;
    Timestamp: number;
}
