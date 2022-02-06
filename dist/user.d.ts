import { Chat } from "./chat";
import { Post } from "./post";
import { Network } from "./network";
import { BaseObject } from "./types";
import { ProfileData, RawUser, Role, Social, UpdateUserProps, UserProps } from "./usertypes";
export declare class User implements BaseObject {
    protected _network: Network;
    createdAt: Date;
    timestamp: number;
    id: string;
    avatarUrl?: string;
    username: string;
    roles: Role[];
    following?: number;
    followers?: number;
    profileIsVisible: unknown;
    bannerUrl?: string;
    description?: string;
    private _clientUserIsFollowing?;
    /**
     * Looks up a user's post history, looks up from newest to oldest.
     * @param oldest Limits the amount of posts searched up to a certain date. By default this is 0, which means it looks up all posts.
     */
    getPosts(oldest?: number): Promise<Post[]>;
    /**
     * Gets a user's chat history
     */
    getChats(): Promise<Chat[]>;
    follow(): Promise<boolean>;
    unfollow(): Promise<boolean>;
    followingList: User[];
    private _isLoadingFollowingUsers;
    loadFollowingUsers(): Promise<void>;
    /**
     * @private Used for updating the details when they update ex: username after the initial creation
     */
    updateRaw(raw: RawUser): void;
    update({ avatarUrl, followers, following, roles }: UpdateUserProps): void;
    static ConvertSocials(socials: ProfileData["Socials"]): Social[];
    static GetUserPropsFromRaw(raw: RawUser): UserProps;
    static FromRaw(network: Network, raw: RawUser): User;
    static NormalizeRoles(role: Role[] | Role | undefined): Role[];
    constructor(_network: Network, { timestamp, id, avatarUrl, followers, following, roles, username }: UserProps);
}
