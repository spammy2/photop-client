import { Chat } from "./chat";
import { Post } from "./post";
import { Network } from "./network";
import { BaseObject, DocumentObject } from "./types";
export declare class User implements BaseObject {
    protected _network: Network;
    createdAt: Date;
    id: string;
    avatarUrl?: string;
    username: string;
    roles: Role[];
    private _clientUserIsFollowing?;
    /**
     * Gets a user's post history
     */
    getPosts(): Promise<Post[]>;
    /**
     * Gets a user's chat history
     */
    getChats(): Promise<Chat[]>;
    follow(): Promise<boolean>;
    unfollow(): Promise<boolean>;
    following: User[];
    private _isLoadingFollowingUsers;
    loadFollowingUsers(): Promise<void>;
    /**
     * @private Used for updating the details when they update ex: username after the initial creation
     */
    update(raw: RawUser): void;
    constructor(_network: Network, /* public */ raw: RawUser);
}
export declare class ClientUser extends User {
    raw: AccountData | SignInAccountData;
    email: string;
    updateClient(raw: AccountData | SignInAccountData): void;
    constructor(network: Network, raw: AccountData | SignInAccountData);
}
export interface RawUser extends DocumentObject {
    CreationTime?: number;
    Role?: Role[];
    User: string;
    Settings?: RawUserSettings;
}
export interface RawUserSettings {
    ProfilePic?: string;
}
/** Account data returned from GetAccountData */
export interface AccountData extends RawUser {
    Email: string;
    LastImportantUpdate: number;
    LastLogin: number;
    Logins: number;
    ProfileData: {
        Visibility: "Private";
    } | {
        Visibility: "Public";
        Description: string;
        Following: number;
        Followers: number;
    };
    Settings: RawClientUserSettings;
    ViewingGroupID?: number;
}
/** Account data returned from SignInAccount */
export interface SignInAccountData {
    Role: Role[] | Role;
    BlockedUsers: RawUser[];
    Email: string;
    ProfileData: {
        Following: number;
        Followers: number;
    };
    RealUser: string;
    Settings: RawClientUserSettings;
    Token: string;
    TokenExpiresDuration: number;
    TokenExpires: number;
    UserID: string;
}
export interface RawClientUserSettings extends RawUserSettings {
    Display: {
        "Embed GIFs": boolean;
        "Embed Scratch Games": boolean;
        "Embed Twitch Live Chat": boolean;
        "Embed Twitch Streams": boolean;
        "Embed YouTube Videos": boolean;
        "Embed code.org Projects": boolean;
        Theme: "Dark Mode" | "Light Mode";
    };
}
declare type Role = "Verified" | "Tester" | "Owner" | "Developer";
export {};
