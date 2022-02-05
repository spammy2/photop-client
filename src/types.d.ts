export type ReqTask =
	| "CreateConnection"
	| "GetAccountData"
	| "GetFollowData"
	| "GetPosts"
	| "ConnectLiveChat"
	| "GetLiveCount"
	| "LoadPlatformEmbeds"
	| "SignInAccount"
	| "LogoutAccount"
	| "CreateChat"
	| "LinkPreview"
	| "GetProfile"
	| "UpdateAccountData"
	| "LikePost"
	| "CreatePost"
	| "UnlikePost"
	| "UpdatePost"
	| "FollowUser"
	| "UnfollowUser"
	| "Search"
	| "GetGroups"
	| "GetGroupMembers"
	| "GroupModerate"
	| "GetSentInvites"
	| "InviteUpdate"
	| "LeaveGroup"
	| "GetChats"
	| "GetInvites";

// Lmao robot_engine spelled 'receive' wrong and made it error
export type ClientFunction = /* "DisplayNewPostMessage" | */ "NewChatRecieve";

export interface GroupInviteData extends DocumentObject {
	Name: string;
	From: string;
}

export type ClientCredentials =
	| { username: string; password: string }
	| { token: string; userid: string; fingerprint: string };

export interface ClientConfiguration {
	/**
	 * Photop-Client is an unofficial node.js library for interacting with Photop.
	 * Since it connects directly with websockets, and the developer is not the owner, there may be bugs in the library.
	 * These bugs most often occur in the network layer, and enabling this option allows one to see the individual messages.
	 * However as messages are numerous, it does clog up the output.
	 * You should enable this option during production, that way if an error occurs, you can report this to the developer.
	 *
	 * *TL;DR Whether Photop-Client should log messages made by WebSockets.*
	 */
	logSocketMessages?: boolean;

	/**
	 * There is a limit to how many chat messages you can post at once.
	 * If it exceeds the limit, it will error. Photop-Client has a built in system to queue chat messages
	 * and send them every few seconds, specified by chatDelay. By default this is 2000 (2 seconds).
	 * You can reduce the time limit if you want to chat messages faster, though it may error.
	 * You can also increase this time limit.
	 *
	 * *TL;DR Delay between chatting messages.*
	 */
	chatDelay?: number;

	/**
	 * Groups are available but they also add a lot of requests, as they are listening to posts from every group the client is in.
	 * Setting this option to true disables group functionality and but also reduces onReady time.
	 *
	 * *TL;DR You should set this to true if you aren't using groups.*
	 */
	disableGroups?: boolean;
}

export interface SocketResponse<body> {
	Body: body & {
		Code: number;
		Message: string;
		ClientFunction?: ClientFunction;
	};
	Metadata: {
		ReqSource: "Client" | "Server";
		SentMetadata: {
			ReqID: number;
			ReqTask: ReqTask;
		};
	};
}

export interface BaseObject {
	id: string;
	timestamp: number;
	createdAt: Date;
}

export interface DocumentObject {
	_id: string;
}
