import { Client } from "./index";
import { Chat } from "./chat";
import { Post } from "./post";
import { Network } from "./network";
import { BaseObject, DocumentObject } from "./types";

export class User implements BaseObject {
	createdAt: Date;
	id: string;
	avatarUrl?: string;
	username: string;
	roles: Role[];

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
		throw new Error("Not Implemented")
	}

	/**
	 * @private Used for updating the details when they update ex: username after the initial creation
	 */
	update(raw: RawUser){
		// this.raw = raw;
		this.avatarUrl = raw.Settings?.ProfilePic;
		this.username = raw.User;
		this.roles = raw.Role || [];
	}

	constructor(public client: Network, /* public */ raw: RawUser){
		this.createdAt = new Date(raw.CreationTime);
		this.id = raw._id;
		this.avatarUrl = raw.Settings?.ProfilePic;
		this.username = raw.User;
		this.roles = raw.Role || [];
	}
}

export class ClientUser extends User {
	email: string;

	constructor(network: Network, public raw: AccountData | SignInAccountData){
		
		super(network, {
			Settings: raw.Settings,
			CreationTime: 0,
			Role: raw.Role,
			_id: "UserID" in raw ? raw.UserID : raw._id,
			User: "RealUser" in raw ? raw.RealUser : raw.User,
		})
		this.email = raw.Email
	}
}

export interface RawUser extends DocumentObject {
	CreationTime: number;
	Role?: Role[];
	User: string;
	Settings: RawUserSettings
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
	ProfileData: {Following: number, Followers: number};
	Settings: RawClientUserSettings;
}

/** Account data returned from SignInAccount */
export interface SignInAccountData {
	Role: Role[];
	BlockedUsers: RawUser[];
	Email: string;
	ProfileData: {Following: number, Followers: number};
	RealUser: string;
	Settings: RawClientUserSettings;
	Token: string;
	TokenExpiresDuration: number;
	TokenExpires: number;
	UserID: string;
}


export interface RawClientUserSettings extends RawUserSettings {
	Display: {
		"Embed GIFs": boolean,
		"Embed Scratch Games": boolean,
		"Embed Twitch Live Chat": boolean,
		"Embed Twitch Streams": boolean,
		"Embed YouTube Videos": boolean,
		"Embed code.org Projects": boolean,
		"Theme": "Dark Mode" | "Light Mode"
	}
}

type Role = "Verified" | "Tester" | "Owner" | "Developer"