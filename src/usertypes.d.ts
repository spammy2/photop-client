import { DocumentObject } from "./types";
export type Role = "Verified" | "Tester" | "Owner" | "Developer";

export type ProfileVisibility = "Public" | "Private" | "Following"

export type UpdateUserProps = Omit<UserProps, "timestamp" | "id">

export interface UserProps {
	timestamp: number,
	id: string,
	avatarUrl?: string,
	followers?: number,
	following?: number,
	username: string,
	roles: Role[],
}

type social = "youtube" | "discord" | "twitter" | "twitch" | "github" | "instagram" | "reddit" | "pinterest";

export interface ProfileData {
	Visibility: ProfileVisibility;
	Description?: string;
	Following: number;
	Followers: number;
	PinnedPost?: number;
	Socials?: Record<`${social}_${string}`, string>
}
export interface RawUser extends DocumentObject {
	CreationTime?: number;
	Role?: Role[] | Role;
	User: string;
	Settings?: RawUserSettings;
	ProfileData?: ProfileData;
}

export interface RawUserSettings {
	ProfileBanner?: string;
	ProfilePic?: string;
}
