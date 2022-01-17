export interface SimpleSocket {
	subscribeEvent<Response>(query: SubscriptionQuery, callback: (data: Response)=>void): void;
}

interface SubscriptionQuery {
	Task: "GeneralUpdate",
	Location: "Home",
}

declare const api: SimpleSocket;

export default api;