import { Post } from "./post";
import { ClientConfiguration, ClientCredentials, GroupInviteData } from "./types";
import { User } from "./user";
import { Group } from "./group";
/**
 * Represents a Photop client
 * Provides an interface of interactions that can be done by the user.
 */
export declare class Client {
    chatDelay: number | undefined;
    /** Gets the user instance that belongs to this client */
    get user(): import("./clientuser").ClientUser | undefined;
    /** Gets the client's userid */
    get userid(): string | undefined;
    /** @private The network instance that manages everything behind the scenes */
    private _network;
    /** Groups that  */
    get groups(): Record<string, Group>;
    /**
     * @deprecated
     * Retrieves a post from cache
     */
    getPostFromCache(id: string): Post | undefined;
    /**
     * Gets a post. If it does not exist in cache, attempts to get it by using timestamp of the objectid.
     */
    getPost(id: string): Promise<Post | undefined>;
    /**
     * The short group id that is used for invitations OR the group id itself.
     * @returns Group; errors if already in group.
     */
    joinGroup(groupid: string): Promise<Group>;
    getUser(id: string): Promise<User | undefined>;
    getUserFromUsername(name: string): Promise<User | undefined>;
    /**
     * Handle posts here
     * This also hooks to posts made in other groups, unless disableGroups is set to true.
     * If you only want to respond to global posts, do `if (!post.group)`
     * @example
     * client.onPost((post)=>{
     * 	post.chat("Hello");
     * })
     */
    onPost: (post: Post) => void;
    onInvite: (invite: GroupInviteData) => void;
    onReady: () => void;
    /**
     * Create a post with text. Images do not seem to work at the present.
     */
    post(text: string, medias?: any[], configuration?: []): Promise<Post>;
    /**
     * Can switch user by passing a username and password. May not work.
     */
    authenticate(username: string, password: string): Promise<void>;
    /**
     * Sign out.
     */
    signout(): Promise<void>;
    /**
     * Create a client with one of two types of credentials.
     * {username, password} or {userid, authtoken} or none at all (this will mean you are signed out)
     */
    constructor(credentials?: ClientCredentials, configuration?: ClientConfiguration);
}
