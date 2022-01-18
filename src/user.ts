import { Chat } from "./chat";
import { Post } from "./post";
import { Network } from "./network";
import { BaseObject, DocumentObject } from "./types";
import { Group, RawGroup, RawGroupJoin } from "./group";

export class User implements BaseObject {
	createdAt: Date;
	id: string;
	avatarUrl?: string;
	username: string;
	roles: Role[];
	
	private _clientUserIsFollowing? = false;

	/**
	 * Gets a user's post history
	 */
	getPosts(): Promise<Post[]> {
		throw new Error("Not Implemented");
	}

	/**
	 * Gets a user's chat history
	 */
	getChats(): Promise<Chat[]> {
		throw new Error("Not Implemented");
	}

	async follow() {
		// do not try to follow if they are already being followed by the user
		if (this._clientUserIsFollowing) return false;
		try {
			await this._network.message("FollowUser", {
				FollowUserID: this.id,
			});
			this._clientUserIsFollowing = true;

			return true;
		} catch (e) {
			return false;
		}
	}
	
	async unfollow() {
		if (this._clientUserIsFollowing === false) return false;

		try {
			await this._network.message("UnfollowUser", { UnfollowUserID: this.id });
			this._clientUserIsFollowing = false;

			return true;
		} catch (e) {
			return false;
		}
	}

	following: User[] = [];

	private _isLoadingFollowingUsers = false;
	async loadFollowingUsers() {
		if (this._isLoadingFollowingUsers) {
			throw new Error("Already getting followed users");
		}
		this._isLoadingFollowingUsers = true;
		this.following = []; //clear following so there are no duplicates
		let before: number | undefined = undefined;
		while (true) {
			const response = await this._network.message<{
				FollowUserIds: string[];
				LastTimestamp: number;
				Users: Record<string, RawUser & { _id: string | undefined, IsFollowing?: true }>;
			}>("GetFollowData", {
				Amount: 50,
				GetUserID: this.id,
				Before: before,
				Type: "Following",
			});

			if (response.Body.FollowUserIds.length === 0) {
				break;
			}
			const users: RawUser[] = [];

			const clientFollowingIds: string[] = [];
			for (const userid of response.Body.FollowUserIds) {
				const user = response.Body.Users[userid];

				if (!user) {
					// i like how it sends back userids even if they are deleted
					// congrats, robot, you made me waste even more time
					continue;
				}

				if (user.IsFollowing) {
					clientFollowingIds.push(userid);
				}
				user._id = userid;
				users.push(user);
			}

			// using processUsers has the added benefit of also putting them into the cache
			const processed = this._network.processUsers(users);
			for (const userid of clientFollowingIds) {
				this._network.users[userid]._clientUserIsFollowing = true;
			}
			this.following = [...this.following, ...processed];

												// really dude?
			before = response.Body.LastTimestamp as number;
		}
	}

	/**
	 * @private Used for updating the details when they update ex: username after the initial creation
	 */
	update(raw: RawUser) {
		this.username = raw.User;

		if (raw.Settings && raw.Settings.ProfilePic) {
			this.avatarUrl = raw.Settings.ProfilePic;
		}

		if (raw.Role) {
			this.roles = raw.Role || [];
		}
	}

	constructor(protected _network: Network, /* public */ raw: RawUser) {
		this.createdAt = new Date(
			raw.CreationTime || parseInt(raw._id.substring(0, 8), 16) * 1000
		);
		this.id = raw._id;
		this.avatarUrl = raw.Settings?.ProfilePic;
		this.username = raw.User;
		this.roles = raw.Role || [];
	}
}

export class ClientUser extends User {
	email: string;

	updateClient(raw: AccountData | SignInAccountData): void {
		super.update({
			Settings: raw.Settings,
			Role:
				Array.isArray(raw.Role) || raw.Role === undefined
					? raw.Role
					: [raw.Role],
			_id: "UserID" in raw ? raw.UserID : raw._id,
			User: "RealUser" in raw ? raw.RealUser : raw.User,
		});
		if (raw.Email) {
			this.email = raw.Email;
		}
	}

	constructor(network: Network, public raw: AccountData | SignInAccountData) {
		super(network, {
			Settings: raw.Settings,
			Role:
				Array.isArray(raw.Role) || raw.Role === undefined
					? raw.Role
					: [raw.Role],
			_id: "UserID" in raw ? raw.UserID : raw._id,
			User: "RealUser" in raw ? raw.RealUser : raw.User,
		});
		this.email = raw.Email;
	}
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
	ProfileData:
		| { Visibility: "Private" }
		| {
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
	ProfileData: { Following: number; Followers: number };
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

type Role = "Verified" | "Tester" | "Owner" | "Developer";
