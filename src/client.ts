import { Post } from "./post";
import { ClientConfiguration, ClientCredentials } from "./types";
import { Network } from "./network";
import { RawUser, User } from "./user";

/**
 * Represents a Photop client
 * Provides an interface of interactions that can be done by the user.
 */
export class Client {
	chatDelay: number | undefined;

	get user() {
		return this._network.user;
	}
	get userid() {
		return this._network.userid;
	}

	private _network: Network;

	/**
	 * @deprecated
	 * Retrieves a post from cache
	 */
	getPostFromCache(id: string): Post | undefined {
		return this._network.posts[id];
	}

	/**
	 * Gets a post. If it does not exist in cache, attempts to get it by using timestamp of the objectid.
	 */
	async getPost(id: string): Promise<Post | undefined> {
		if (this._network.posts[id]) return this._network.posts[id];

		console.log(new Date(parseInt(id.substring(0, 8), 16) * 1000 - 5000));
		await this._network.getPosts(
			10,
			parseInt(id.substring(0, 8), 16) * 1000 - 5000
		); //offset by 5 seconds in case the time is actually BEFORE it was posted
		console.log(this._network.posts);
		return this._network.posts[id];
	}

	async getUser(id: string): Promise<User | undefined> {
		if (this._network.users[id]) return this._network.users[id];

		const data = (await fetch(
			"https://photoprest.herokuapp.com/Users?UserId=" + id
		)
			.then((e) => e.json())
			.catch(() => {
				console.log("fetch to photoprest resulted in error");
			})) as { user: RawUser };

		new User(this._network, data.user);
	}

	/**
	 * Handle posts here
	 * @example
	 * client.onPost((post)=>{
	 * 	post.chat("Hello");
	 * })
	 */
	onPost = (post: Post) => {};

	onReady = () => {};

	/**
	 * Create a post with text. Images do not seem to work at the present.
	 */
	async post(text: string, medias: any[] = [], configuration: [] = []) {
		return this._network.post(text, medias, configuration);
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
	constructor(
		credentials?: ClientCredentials,
		configuration?: ClientConfiguration
	) {
		this._network = new Network(credentials, configuration);
		this._network.onPost = (post) => {
			this.onPost(post);
		};
		this._network.onReady = () => {
			this.onReady();
		};
	}
}
