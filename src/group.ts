import { GroupUser, RawGroupUser } from "./groupuser";
import { Network } from "./network";
import { Post } from "./post";
import { BaseObject, DocumentObject } from "./types";
import { User } from "./user";
import { RawUser } from "./usertypes";

export enum GroupInviteType {
	Self,
	Anyone,
	Unknown
}

export class Group implements BaseObject {
	id: string;
	createdAt: Date;
	timestamp: number;

	/** TODO: implement this */
	clientIsInGroup: boolean = true;
	name: string;
	members: Record<string, GroupUser> = {};
	owner?: GroupUser;
	icon?: string;
	inviteType: GroupInviteType;
	onUserJoined = (user: GroupUser)=>{};
	onUserLeft = (user: GroupUser)=>{};
	onDeleted = ()=>{};
	
	/**
	 * Used internally;
	 */
	readonly onReadyPromise: Promise<void>;

	/** Leave this group */
	async leave(){
		await this._network.message("LeaveGroup", {GroupID: this.id});
	}

	async delete(){
		throw new Error("Not Implemented")
	}

	/**
	 * Create a post with text. Images do not seem to work at the present.
	 */
	async post(text: string, medias: any[] = [], configuration: [] = []) {
		return await this._network.post(text, this.id, medias, configuration);
	}

	constructor(private _network: Network, raw: RawGroup){
		this.id = raw._id;
		this.createdAt = new Date(raw.Timestamp);
		this.timestamp = raw.Timestamp;
		this.name = raw.Name;
		this.icon = raw.Icon;
		this.inviteType = GroupInviteType[raw.Invite];
		this._network.simpleSocket.subscribeEvent<{
			Type: "Delete" | "Refresh" | "MemberUpdate" | "NewPostAdded",
			NewPostData: DocumentObject & {Timestamp: number, UserID: string},
			Member: RawGroupUser,
		}>({Task: "GroupUpdate", GroupID: this.id}, (data)=>{
			if (data.Type === "MemberUpdate") {
				if (data.Member.Status===-1) {
					const groupUser = this.members[data.Member._id];
					delete this.members[data.Member._id];
					this.onUserLeft(groupUser)
				} else {
					if (this.members[data.Member._id]) {
						this.members[data.Member._id].user.updateRaw(data.Member);
						this.members[data.Member._id].status = data.Member.Status;
					} else {
						this._network.processUsers([data.Member]);
						this.members[data.Member._id] = new GroupUser(this._network, this, this._network.users[data.Member._id], data.Member);
						this.onUserJoined(this.members[data.Member._id]);
					}
				}
			} else if (data.Type === "NewPostAdded") {
				this._network.getPosts({groupid: this.id});
			} else if (data.Type === "Delete"){
				delete this._network.groups[this.id];
				this._network.onGroupsChanged();
				this.onDeleted();
			}
		})

		this.onReadyPromise = new Promise((res, rej)=>{
			this._network.message<{Members: RawGroupUser[]}>("GetGroupMembers", {GroupID: this.id}).then((response)=>{
				this._network.processUsers(response.Body.Members)
				response.Body.Members.forEach(raw=>{
					if (!this.members[raw._id]) {
						this.members[raw._id] = new GroupUser(this._network, this, this._network.users[raw._id], raw);
					}
				});
				this.owner = this.members[raw.Owner];
				this._network.getPosts({groupid: this.id, initial:true}).then(()=>{
					res();
				});
			})	
		})

	}
}

export interface RawGroup extends DocumentObject {
	LastContent: number;
	Name: string;
	Timestamp: number;
	// userid
	Owner: string;
	Invite: "Self" | "Anyone",
	Icon: string,
}

export interface RawGroupJoin extends DocumentObject {
	Group: string;
	LastSeen: number;
}