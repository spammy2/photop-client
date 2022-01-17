import { Chat, RawChat } from "./chat";
import { Post } from "./post";
import { ClientConfiguration, ClientCredentials, ReqTask, SocketResponse } from "./types";
import { ClientUser, RawUser, User } from "./user";
import { WebSocket } from "ws";
export declare class Network {
    config?: ClientConfiguration | undefined;
    readonly socket: WebSocket;
    readonly simpleSocket: import("./vendor/simplesocket").SimpleSocket;
    readonly awaitingMessages: Record<string, (result: SocketResponse<any>) => void>;
    posts: Record<string, Post>;
    chats: Record<string, Chat>;
    users: Record<string, User>;
    authtoken?: string;
    userid?: string;
    connectedChats: string[];
    user?: ClientUser;
    chatDelay: number;
    onPost: (post: Post) => void;
    onReady: () => void;
    post(text: string, medias: any[], configuration: []): Promise<Post>;
    getPosts(amount?: number, before?: number, initial?: boolean): Promise<Post[]>;
    connectChat(postid: string): Promise<void>;
    disconnectChat(postid: string): Promise<void>;
    processUsers(rawUsers: RawUser[]): void;
    reply(postid: string, replyid: string, text: string): Promise<Chat>;
    chat(postid: string, text: string): Promise<Chat>;
    chatQueue: {
        postid: string;
        replyid?: string;
        text: string;
        res: (chat: Chat) => void;
        rej: (msg: string) => void;
    }[];
    isProcessing: boolean;
    private next;
    private _chat;
    processChats(rawChats: RawChat[]): void;
    authenticate(username: string, password: string): Promise<void>;
    private _init;
    private reqid;
    message<Body>(task: ReqTask, body?: any): Promise<SocketResponse<Body>>;
    signout(): Promise<{
        Code: number;
        Message: string;
        ClientFunction?: "NewChatRecieve" | undefined;
    }>;
    constructor(credentials?: ClientCredentials, config?: ClientConfiguration | undefined);
}
