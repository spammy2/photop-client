"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const network_1 = require("./network");
/**
 * Represents a Photop client
 * Provides an interface of interactions that can be done by the user.
 */
class Client {
    chatDelay;
    get user() {
        return this._network.user;
    }
    get userid() {
        return this._network.userid;
    }
    _network;
    /** debug purposes only. not practical. Retrieves a {Post} from id if the post is cached.
     * Posts should only be obtained by Client.onPost
     */
    getPostFromCache(id) {
        return this._network.posts[id];
    }
    /**
     * Handle posts here
     * @example
     * client.onPost((post)=>{
     * 	post.chat("Hello");
     * })
     */
    onPost = (post) => { };
    onReady = () => { };
    /**
     * Create a post with text. Images do not seem to work at the present.
     */
    async post(text, medias = [], configuration = []) {
        return this._network.post(text, medias, configuration);
    }
    /**
     * Can switch user by passing a username and password. May not work.
     */
    async authenticate(username, password) {
        this._network.authenticate(username, password);
    }
    /**
     * Sign out.
     */
    async signout() {
        this._network.signout();
    }
    /**
     * Create a client with one of two types of credentials.
     * {username, password} or {userid, authtoken} or none at all (this will mean you are signed out)
     */
    constructor(credentials, configuration) {
        this._network = new network_1.Network(credentials, configuration);
        this._network.onPost = (post) => {
            this.onPost(post);
        };
        this._network.onReady = () => {
            this.onReady();
        };
    }
}
exports.Client = Client;
