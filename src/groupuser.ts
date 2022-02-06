import { Group } from "./group";
import { Network } from "./network";
import { User } from "./user";
import { RawUser } from "./usertypes";

export class GroupUser {
	status: GroupUserStatus;

	get id() {
		return this.user.id;
	}

	async kick() {
		await this._network.message("GroupModerate", {
			GroupID: this.group.id,
			Type: "Kick",
			User: this.id,
		});
	}

	constructor(
		private _network: Network,
		public readonly group: Group,
		public readonly user: User,
		raw: RawGroupUser
	) {
		this.status = raw.Status;
	}
}

export const enum GroupUserStatus {
	Offline,
	Online,
	InGroup,
}

export interface RawGroupUser extends RawUser {
	Status: GroupUserStatus | -1;
	ViewingGroupID?: number;
}
