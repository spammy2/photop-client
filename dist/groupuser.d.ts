import { Group } from "./group";
import { Network } from "./network";
import { User } from "./user";
import { RawUser } from "./usertypes";
export declare class GroupUser {
    private _network;
    readonly group: Group;
    readonly user: User;
    status: GroupUserStatus;
    get id(): string;
    kick(): Promise<void>;
    constructor(_network: Network, group: Group, user: User, raw: RawGroupUser);
}
export declare const enum GroupUserStatus {
    Offline = 0,
    Online = 1,
    InGroup = 2
}
export interface RawGroupUser extends RawUser {
    Status: GroupUserStatus | -1;
    ViewingGroupID?: number;
}
