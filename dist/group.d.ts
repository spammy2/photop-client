import { GroupUser } from "./groupuser";
import { Network } from "./network";
import { Post } from "./post";
import { BaseObject, DocumentObject } from "./types";
export declare enum GroupInviteType {
    Self = 0,
    Anyone = 1,
    Unknown = 2
}
export declare class Group implements BaseObject {
    private _network;
    id: string;
    createdAt: Date;
    name: string;
    members: Record<string, GroupUser>;
    owner?: GroupUser;
    icon?: string;
    invite: GroupInviteType;
    onUserJoined: (user: GroupUser) => void;
    onUserLeft: (user: GroupUser) => void;
    onDelete: () => void;
    onReadyPromise: Promise<void>;
    onPost: (post: Post) => void;
    leave(): Promise<void>;
    delete(): Promise<void>;
    /**
     * Create a post with text. Images do not seem to work at the present.
     */
    post(text: string, medias?: any[], configuration?: []): Promise<Post>;
    constructor(_network: Network, raw: RawGroup);
}
export interface RawGroup extends DocumentObject {
    LastContent: number;
    Name: string;
    Timestamp: number;
    Owner: string;
    Invite: "Self" | "Anyone";
    Icon: string;
}
export interface RawGroupJoin extends DocumentObject {
    Group: string;
    LastSeen: number;
}