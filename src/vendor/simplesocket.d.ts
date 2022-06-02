class Subscription<T extends SubscriptionQuery = SubscriptionQuery> {
	id: string;
	edit(newFilter: T): void;
	close(): void;
}
export default class SimpleSocket {
	constructor(init: {project_id: string, project_token: string})
	socket: WebSocket;
	showDebug: boolean;
	remotes: Record<string, (body: any)=>void>
	subscribe<Response>(query: SubscriptionQuery, callback: (data: Response)=>void): Subscription<T>;
	secureId: string;
}

type SubscriptionQuery = {
	Task: "GeneralUpdate",
	Location: "Home",
	Groups: string[],
	UserID?: string,
} | {
	Task: "GroupUpdate",
	GroupID: string;
} | {
	Task: "NewGroupInvite",
	UserID?: string,
} | {
	Task: "PostUpdate",
	_id: string[],
}
