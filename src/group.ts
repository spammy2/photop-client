import { GroupUser, RawGroupUser } from "./groupuser";
import { Network } from "./network";
import { Post } from "./post";
import { BaseObject, DocumentObject } from "./types";
import { RawUser, User } from "./user";

export enum GroupInviteType {
	Self,
	Anyone,
	Unknown
}

export class Group implements BaseObject {
	id: string;
	createdAt: Date;
	name: string;
	members: Record<string, GroupUser> = {};
	owner?: GroupUser;
	icon?: string;
	invite: GroupInviteType;
	onUserJoined = (user: GroupUser)=>{};
	onUserLeft = (user: GroupUser)=>{};
	onDelete = ()=>{};
	
	onReadyPromise: Promise<void>;
	
	onPost = (post: Post)=>{}

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
		this.name = raw.Name;
		this.icon = raw.Icon;
		this.invite = GroupInviteType[raw.Invite];
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
						this.members[data.Member._id].user.update(data.Member);
						this.members[data.Member._id].status = data.Member.Status;
					} else {
						this._network.processUsers([data.Member]);
						this.members[data.Member._id] = new GroupUser(this._network, this, this._network.users[data.Member._id], data.Member);
						this.onUserJoined(this.members[data.Member._id]);
					}
				}
			} else if (data.Type === "NewPostAdded") {
				this._network.getPosts(undefined, undefined, this.id);
			} else if (data.Type === "Delete"){
				delete this._network.groups[this.id];
				this._network.onGroupsChanged();
				this.onDelete();
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
				this._network.getPosts(undefined, undefined, this.id, true).then(()=>{
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