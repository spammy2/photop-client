import { decode } from "html-entities";
import { Group } from "./group";
import { Network } from "./network";
import { Post } from "./post";
import { BaseObject, DocumentObject } from "./types";
import { User } from "./user";

export class Chat implements BaseObject {
	timestamp: number;
	createdAt: Date;
	id: string;
	text: string;
	replyTo?: Chat;
	group?: Group;

	/**
	 * Update is for when some values are unknown at instantiation time
	 */
	update(raw: RawChat){
		this.raw = raw;
		this.timestamp = raw.Timestamp;
		this.createdAt = new Date(raw.Timestamp);
		this.id = raw._id;
		this.text = decode(raw.Text);
	}

	reply(text: string){
		this._network.reply(text, this.post.id, this.id, this.group?.id)
	}

	onDeleted = ()=>{};

	constructor(private _network: Network, public user: User, public post: Post, public raw: RawChat, replyTo?: Chat) {
		this.createdAt = new Date(raw.Timestamp);
		this.timestamp = raw.Timestamp;
		this.id = raw._id;
		this.text = decode(raw.Text);
		this.replyTo = replyTo;
		if (raw.GroupID) {
			this.group = this._network.groups[raw.GroupID];
		}
	}
}

export interface RawChat extends DocumentObject {
	PostID: string;
	ReplyID?: string;
	GroupID?: string;
	Text: string;
	UserID: string;
	Timestamp: number;
}