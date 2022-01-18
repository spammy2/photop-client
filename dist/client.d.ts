import { Post } from "./post";
import { ClientConfiguration, ClientCredentials } from "./types";
import { User } from "./user";
import { Group } from "./group";
/**
 * Represents a Photop client
 * Provides an interface of interactions that can be done by the user.
 */
export declare class Client {
    chatDelay: number | undefined;
    get user(): import("./user").ClientUser | undefined;
    get userid(): string | undefined;
    private _network;
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
     * The short group id that is used for invitations.
     * @returns Group; errors if already in group.
     */
    joinGroup(groupinviteid: string): Promise<Group>;
    leaveGroup(groupid: string): Promise<void>;
    getUser(id: string): Promise<User | undefined>;
    getUserFromUsername(name: string): Promise<User | undefined>;
    /**
     * Handle posts here
     * @example
     * client.onPost((post)=>{
     * 	post.chat("Hello");
     * })
     */
    onPost: (post: Post) => void;
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
