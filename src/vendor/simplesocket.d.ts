export interface SimpleSocket {
	subscribeEvent<Response>(query: SubscriptionQuery, callback: (data: Response)=>void): void;
	connect(details: {project_id: string, client_token: string}): void;
}

interface SubscriptionQuery {
	Task: "GeneralUpdate",
	Location: "Home",
}

declare const api: SimpleSocket;

export default api;