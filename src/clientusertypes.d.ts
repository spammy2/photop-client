import { RawGroup } from "./group";
import { Role, UserProps, RawUser, RawUserSettings, ProfileData } from "./usertypes";

export type UpdateClientUserProps = Omit<ClientUserProps, "timestamp" | "id">

export interface ClientUserProps extends UserProps {
	email: string;
}

/** Account data returned from GetAccountData */
export interface AccountData extends RawUser {
	Email: string;
	LastImportantUpdate: number;
	LastLogin: number;
	Logins: number;

	Settings: RawClientUserSettings;
	ViewingGroupID?: number;
}

/** Account data returned from SignInAccount */
export interface SignInAccountData {
	Role: Role[] | Role;
	BlockedUsers: RawUser[];
	Email: string;
	ProfileData: ProfileData,
	RealUser: string;
	Settings: RawClientUserSettings;
	Token: string;
	TokenExpiresDuration: number;
	TokenExpires: number;
	UserID: string;
	Groups?: RawGroup[]
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