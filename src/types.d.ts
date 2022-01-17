export type ReqTask =
| "CreateConnection"
| "GetAccountData"
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

// Lmao robot_engine spelled 'receive' wrong and made it error
export type ClientFunction = /* "DisplayNewPostMessage" | */ "NewChatRecieve";


export type ClientCredentials =
	| { username: string; password: string }
	| { token: string; userid: string };

export interface ClientConfiguration {
	logSocketMessages?: boolean;
	chatDelay?: number;
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
	createdAt: Date;
}

export interface DocumentObject {
	_id: string;
}