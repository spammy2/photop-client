import { Chat } from "./chat";
import { Post } from "./post";
import { Network } from "./network";
import { BaseObject, DocumentObject } from "./types";
import { ProfileData, RawUser, Role, Social, UpdateUserProps, UserProps } from "./usertypes";


export class User implements BaseObject {
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

	private _clientUserIsFollowing? = false;

	/**
	 * Looks up a user's post history, looks up from newest to oldest.
	 * @param oldest Limits the amount of posts searched up to a certain date. By default this is 0, which means it looks up all posts.
	 */
	async getPosts(oldest = 0): Promise<Post[]> {
		let last = await this._network.getPosts({ userid: this.id });
		let all: Post[] = [];

		for (const p of last) {
			if (p.timestamp >= oldest) {
				all.push(p);
			} else {
				return all;
			}
		}

		while (true) {
			last = await this._network.getPosts({
				userid: this.id,
				before: last[last.length - 1].timestamp,
			});
			if (last.length === 0) {
				return all;
			}
			for (const p of last) {
				if (p.timestamp >= oldest) {
					all.push(p);
				} else {
					return all;
				}
			}
		}
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
			await this._network.message("UnfollowUser", {
				UnfollowUserID: this.id,
			});
			this._clientUserIsFollowing = false;

			return true;
		} catch (e) {
			return false;
		}
	}

	followingList: User[] = [];

	private _isLoadingFollowingUsers = false;
	async loadFollowingUsers() {
		if (this._isLoadingFollowingUsers) {
			throw new Error("Already getting followed users");
		}
		this._isLoadingFollowingUsers = true;
		this.followingList = []; //clear following so there are no duplicates
		let before: number | undefined = undefined;
		while (true) {
			const response = await this._network.message<{
				FollowUserIds: string[];
				LastTimestamp: number;
				Users: Record<
					string,
					RawUser & { _id: string | undefined; IsFollowing?: true }
				>;
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
			this.followingList = [...this.followingList, ...processed];

			// really dude?
			before = response.Body.LastTimestamp as number;
		}
	}

	/**
	 * @private Used for updating the details when they update ex: username after the initial creation
	 */
	updateRaw(raw: RawUser) {
		this.username = raw.User;
		if (raw.Settings && raw.Settings.ProfilePic) {
			this.avatarUrl = raw.Settings.ProfilePic;
		}

		this.roles = User.NormalizeRoles(raw.Role);
	}

	update({avatarUrl,followers,following,roles=[]}: UpdateUserProps) {
		this.avatarUrl = avatarUrl;
		this.followers = followers;
		this.following = following;
		this.roles = roles;
	}

	static ConvertSocials(socials: ProfileData["Socials"]): Social[] {
		//TODO: Convert Socials
		return [];
	}

	static GetUserPropsFromRaw(raw: RawUser): UserProps {
		return {
			id: raw._id,
			timestamp: raw.CreationTime || parseInt(raw._id.substring(0, 8), 16) * 1000,
			avatarUrl: raw.Settings?.ProfilePic,
			username: raw.User,
			roles: this.NormalizeRoles(raw.Role),
			socials: raw.ProfileData ? this.ConvertSocials(raw.ProfileData.Socials) : [],
		}
	}

	// Creates a user from raw data
	static FromRaw(network: Network, raw: RawUser){
		return new User(network, this.GetUserPropsFromRaw(raw))
	}

	static NormalizeRoles(role: Role[] | Role | undefined) {
		return role ? (Array.isArray(role) ? role : [role]) : []
	}

	constructor(protected _network: Network, {timestamp,id,avatarUrl,followers,following,roles=[],username}: UserProps) {
		this.timestamp = timestamp;
		this.createdAt = new Date(timestamp);
		this.id = id;
		this.avatarUrl = avatarUrl;
		this.username = username;
		this.roles = roles;
		this.followers = followers;
		this.following = following;
	}
}