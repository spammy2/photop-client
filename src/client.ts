import { Post } from "./post";
import { ClientConfiguration, ClientCredentials } from "./types";
import { Network } from "./network";


/**
 * Represents a Photop client
 * Provides an interface of interactions that can be done by the user.
 */
export class Client {
	chatDelay: number | undefined;
	

	get user(){
		return this._network.user;
	}
	get userid(){
		return this._network.userid;
	}

	private _network: Network;	


	/** debug purposes only. not practical. Retrieves a {Post} from id if the post is cached.
	 * Posts should only be obtained by Client.onPost
	 */
	getPostFromCache(id: string): Post | undefined {
		return this._network.posts[id];
	}

	/**
	 * Handle posts here
	 * @example
	 * client.onPost((post)=>{
	 * 	post.chat("Hello");
	 * })
	 */
	onPost = (post: Post)=>{}


	onReady = ()=>{};	


	/**
	 * Create a post with text. Images do not seem to work at the present.
	 */
	async post(text: string, medias: any[] = [], configuration: [] = []){
		return this._network.post(text, medias, configuration)
	}

	/**
	 * Can switch user by passing a username and password. May not work.
	 */
	async authenticate(username: string, password: string) {
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
	constructor(credentials?: ClientCredentials, configuration?: ClientConfiguration) {
		this._network = new Network(credentials, configuration);
		this._network.onPost = (post)=>{
			this.onPost(post);
		}
		this._network.onReady = ()=>{
			this.onReady();
		}

	}

}