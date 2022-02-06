import { Chat, RawChat } from "./chat";
import { Post } from "./post";
import { ClientConfiguration, ClientCredentials, GroupInviteData, ReqTask, SocketResponse } from "./types";
import { ClientUser } from "./clientuser";
import { WebSocket } from "ws";
import { Group } from "./group";
import { RawUser } from "./usertypes";
import { User } from "./user";
export declare class Network {
    config?: ClientConfiguration | undefined;
    socket: WebSocket;
    readonly simpleSocket: import("./vendor/simplesocket").SimpleSocket;
    readonly awaitingMessages: Record<string, (result: SocketResponse<any>) => void>;
    posts: Record<string, Post>;
    chats: Record<string, Chat>;
    users: Record<string, User>;
    groups: Record<string, Group>;
    authtoken?: string;
    userid?: string;
    connectedPosts: Set<string>;
    user?: ClientUser;
    chatDelay: number;
    onInvite: (invite: GroupInviteData) => void;
    onPost: (post: Post) => void;
    onReady: () => void;
    fingerprint: string;
    generalUpdateSub?: string;
    groupInvitesSub?: string;
    postUpdateSub?: string;
    profileUpdate?: string;
    post(text: string, groupid: string | undefined, medias: any[], configuration: []): Promise<Post>;
    getPosts({ amount, groupid, before, userid, initial, }: Partial<GetPostsQuery>): Promise<Post[]>;
    connectChat(postid: string): Promise<void>;
    disconnectChat(postid: string): Promise<void>;
    processUsers(rawUsers: RawUser[]): User[];
    reply(text: string, postid: string, replyid: string, groupid?: string): Promise<Chat>;
    chat(text: string, postid: string, groupid?: string): Promise<Chat>;
    chatQueue: {
        postid: string;
        replyid?: string;
        groupid?: string;
        text: string;
        res: (chat: Chat) => void;
        rej: (msg: string) => void;
    }[];
    isProcessing: boolean;
    private next;
    private _chat;
    /**
     *
     * @param rawChats RawChats
     * @param autosort Whether a post's chats should be automatically sorted afterwards
     * DOES NOT MUTATE Post.chats. Do it yourself.
     */
    processChats(rawChats: RawChat[], autosort?: boolean): Chat[];
    authenticate(username: string, password: string): Promise<void>;
    onGroupsChanged(): void;
    private _init;
    private reqid;
    message<Body>(task: ReqTask, body?: Record<string, undefined | string | number | Array<any>>): Promise<SocketResponse<Body>>;
    signout(): Promise<{
        Code: number;
        Message: string;
        ClientFunction?: "NewChatRecieve" | undefined;
    }>;
    constructor(credentials?: ClientCredentials, config?: ClientConfiguration | undefined);
}
export interface GetPostsQuery {
    amount: number;
    before: number;
    userid: string;
    groupid: string;
    initial: true;
}
