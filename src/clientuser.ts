import { AccountData, ClientUserProps, SignInAccountData } from "./clientusertypes";
import { Network } from "./network";
import { User } from "./user";

export class ClientUser extends User {
	email: string;

	updateRaw(raw: AccountData): void {
		super.updateRaw(raw);
		if (raw.Email) {
			this.email = raw.Email;
		}
	}

	static FromAccountData(network: Network, raw: AccountData) {
		return new ClientUser(network, {...this.GetUserPropsFromRaw(raw), email: raw.Email})
	}

	static FromSignIn(network: Network, raw: SignInAccountData) {
		return new ClientUser(network, {
			socials: this.ConvertSocials(raw.ProfileData.Socials),
			email: raw.Email,
			roles: this.NormalizeRoles(raw.Role),
			timestamp: parseInt(raw.UserID.substring(0, 8), 16) * 1000,
			id: raw.UserID,
			username: raw.RealUser,
		})
	}

	constructor(network: Network, props: ClientUserProps) {
		super(network, props);
		this.email = props.email;
	}
}


