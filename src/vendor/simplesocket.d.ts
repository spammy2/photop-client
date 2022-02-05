export interface SimpleSocket {
	subscribeEvent<Response>(query: SubscriptionQuery, callback: (data: Response)=>void): string;
	editSubscribe(subid: string, query: SubscriptionQuery): void;
	connect(details: {project_id: string, client_token: string}): Promise<void>;
	debug: boolean,
	remoteFunctions: Record<string, (body: any)=>void>
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


declare const api: SimpleSocket;

export default api