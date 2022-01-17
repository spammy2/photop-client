import { Post } from "./post";
import { ClientConfiguration, ClientCredentials } from "./types";
/**
 * Represents a Photop client
 * Provides an interface of interactions that can be done by the user.
 */
export declare class Client {
    chatDelay: number | undefined;
    get user(): import("./user").ClientUser | undefined;
    get userid(): string | undefined;
    private _network;
    /** debug purposes only. not practical. Retrieves a {Post} from id if the post is cached.
     * Posts should only be obtained by Client.onPost
     */
    getPostFromCache(id: string): Post | undefined;
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
