export interface SimpleSocket {
	subscribeEvent<Response>(query: SubscriptionQuery, callback: (data: Response)=>void): string;
	editSubscribe(subid: string, query: SubscriptionQuery): void;
	connect(details: {project_id: string, client_token: string}): Promise<void>;
	debug: boolean,
}

type SubscriptionQuery = {
	Task: "GeneralUpdate",
	Location: "Home",
	Groups: string[],
	UserID: string,
} | {
	Task: "GroupUpdate",
	GroupID: string;
}


declare const api: SimpleSocket;

export default api