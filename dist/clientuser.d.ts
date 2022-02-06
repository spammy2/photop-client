import { AccountData, ClientUserProps, SignInAccountData } from "./clientusertypes";
import { Network } from "./network";
import { User } from "./user";
export declare class ClientUser extends User {
    email: string;
    updateRaw(raw: AccountData): void;
    static FromAccountData(network: Network, raw: AccountData): ClientUser;
    static FromSignIn(network: Network, raw: SignInAccountData): ClientUser;
    constructor(network: Network, props: ClientUserProps);
}
