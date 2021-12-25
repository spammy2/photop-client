"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const chat_1 = require("./chat");
const post_1 = require("./post");
const form_data_1 = __importDefault(require("form-data"));
const user_1 = require("./user");
const ws_1 = __importDefault(require("ws"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const SOCKET_URL = "wss://api.photop.live/Server1";
const IMAGE_UPLOAD_URL = "https://api.photop.live:3000/ImageUpload";
/**
 * Represents a Photop client
 * Provides an interface of interactions that can be done by the user.
 */
class Client {
    _socket;
    awaitingMessages = {};
    _reqid = 0;
    chatDelay;
    _message(task, body) {
        return new Promise((res, rej) => {
            const message = {
                Body: body,
                Metadata: {
                    ...(this._authtoken
                        ? {
                            AuthToken: this._authtoken,
                            UserID: this._userid,
                        }
                        : {}),
                    ReqID: this._reqid,
                    ReqTask: task,
                    // After careful review from Photop Client staff, we have determined that fingerprint is very useless
                    // The length is completely arbitrary and we can substitute this for a random number generator
                    Fingerprint: this.fingerprint,
                },
            };
            if (this.logSocketMessages) {
                console.log("SEND", message);
            }
            this._socket.send(JSON.stringify(message));
            this.awaitingMessages[this._reqid] = (result) => {
                if (result.Body.Code !== 200) {
                    rej(result.Body.Message);
                }
                else {
                    res(result);
                }
            };
            this._reqid++;
        });
    }
    _authtoken;
    _userid;
    _posts = {};
    _chats = {};
    _users = {};
    _processUsers(rawUsers) {
        for (const rawUser of rawUsers) {
            if (rawUser._id in this._users) {
                this._users[rawUser._id].update(rawUser);
            }
            else {
                this._users[rawUser._id] = new user_1.User(this, rawUser);
            }
        }
    }
    _processChats(rawChats) {
        for (const rawChat of rawChats) {
            if (rawChat._id in this._chats) {
                this._chats[rawChat._id].update(rawChat);
            }
            else {
                const chat = new chat_1.Chat(this, this._users[rawChat.UserID], this._posts[rawChat.PostID], rawChat);
                this._posts[rawChat.PostID].chats.push(chat);
                this._chats[rawChat._id] = chat;
            }
        }
        //we do it again because some of the chats may be registered before the ones they are replying to are
        for (const rawChat of rawChats) {
            if (rawChat.ReplyID) {
                this._chats[rawChat._id].replyTo = this._chats[rawChat.ReplyID];
            }
        }
    }
    async _init(credentials) {
        let a = await this._message("CreateConnection");
        if (credentials) {
            if ("username" in credentials) {
                await this.authenticate(credentials.username, credentials.password);
            }
            else if ("token" in credentials) {
                this._authtoken = credentials.token;
                this._userid = credentials.userid;
                await this._getAccountData();
            }
            else {
                console.warn("Credentials were provided but they are not username-password or token-userid. Falling back to 'guest' mode");
            }
        }
        await this._getPosts(undefined, undefined, true);
        this._readyListeners.forEach((callback) => {
            callback();
        });
    }
    async _getPosts(amount = 15, before, initial = false) {
        const response = await this._message("GetPosts", {
            Amount: amount,
            ...(before ? { Before: before } : {}),
        });
        this._processUsers(response.Body.Users);
        const posts = response.Body.Posts.map((rawPost) => {
            return new post_1.Post(this, rawPost, this._users[rawPost.UserID]);
        });
        for (const post of posts) {
            if (!(post.id in this._posts)) {
                this._posts[post.id] = post;
                if (!initial) {
                    this._postListeners.forEach((listener) => {
                        listener(post);
                    });
                }
            }
        }
        if (Array.isArray(response.Body.Likes)) {
            for (const like of response.Body.Likes) {
                const postid = like._id.substring(0, posts[0].id.length);
                const userid = like._id.substring(postid.length);
                this._posts[postid].usersLiked.push({
                    user: this._users[userid],
                    raw: like,
                    likedAt: new Date(like.Timestamp),
                });
            }
        }
        return posts;
    }
    _postListeners = [];
    _newPosts = {};
    logSocketMessages;
    // fingerprint is so mysterious changing one value breaks it but leaving it like this works???
    // i'm honestly confused but i dont care anymore
    fingerprint = "25010157537369604664110537365900144030";
    async post(text, medias = [], configuration = []) {
        const body = {
            Text: text,
            Configuration: configuration,
            Media: {},
        };
        if (medias.length > 0) {
            body.Media.ImageCount = medias.length;
        }
        const response = await this._message("CreatePost", body);
        if (medias.length > 0) {
            const data = new form_data_1.default();
            data.append("RequestData", JSON.stringify({
                AccountData: {
                    AuthToken: this._authtoken,
                    UserID: this._userid,
                    Fingerprint: this.fingerprint,
                },
                Metadata: { PostID: response.Body.NewPostID },
            }));
            for (let i = 0; i < medias.length; i++) {
                data.append(`File${i}`, medias[i]);
            }
            await (0, node_fetch_1.default)(IMAGE_UPLOAD_URL, {
                method: "POST",
                body: data,
            });
        }
        await this._getPosts();
        return this._posts[response.Body.NewPostID];
    }
    /** debug purposes only. not practical */
    getPostFromCache(id) {
        return this._posts[id];
    }
    /**
     * Handle posts here
     * @example
     * client.onPost((post)=>{
     * 	post.chat("Hello");
     * })
     */
    onPost(callback) {
        this._postListeners.push(callback);
    }
    _errorListeners = [];
    /**
     * Errors such as authorization errors will be outputted here
     */
    onError(callback) {
        this._errorListeners.push(callback);
    }
    _readyListeners = [];
    onReady(callback) {
        this._readyListeners.push(callback);
    }
    async _getAccountData() {
        const response = await this._message("GetAccountData");
    }
    user;
    _chatQueue = [];
    _isProcessing = false;
    next() {
        const first = this._chatQueue.shift();
        if (first) {
            this._isProcessing = true;
            this._chat(first.text, first.postid, first.replyid).then(chat => {
                first.res(chat);
                setTimeout(this.next.bind(this), this.chatDelay);
            });
        }
        else {
            this._isProcessing = false;
        }
    }
    async _chat(text, postid, replyid) {
        const response = await this._message("CreateChat", {
            PostID: postid,
            ...(replyid ? { ReplyID: replyid } : {}),
            Text: text,
        });
        return new chat_1.Chat(this, this.user, this._posts[postid], {
            Text: text,
            _id: response.Body.NewChatID,
            UserID: this.user.id,
            ReplyID: replyid,
            PostID: postid,
            Timestamp: 0, // the response for CreateChat does not include the timestamp, so we must wait for NewChatReceive in order to
        });
    }
    async reply(postid, replyid, text) {
        return new Promise((res, rej) => {
            this._chatQueue.push({ postid, replyid, text, res, rej });
            if (!this._isProcessing) {
                this.next();
            }
        });
    }
    async chat(postid, text) {
        return new Promise((res, rej) => {
            this._chatQueue.push({ postid, text, res, rej });
            if (!this._isProcessing) {
                this.next();
            }
        });
    }
    _connectedChats = [];
    async connectChat(postid) {
        this._connectedChats.push(postid);
        // no idea why they are separate but not something we care about
        const response = await this._message("ConnectLiveChat", {
            Amount: 25,
            Posts: this._connectedChats,
            ChatPosts: this._connectedChats,
        });
        this._processUsers(response.Body.Users);
        this._processChats(response.Body.Chats);
    }
    async disconnectChat(postid) {
        this._connectedChats = this._connectedChats.filter(id => id !== postid);
    }
    async authenticate(username, password) {
        const response = await this._message("SignInAccount", {
            Username: username,
            Password: password,
        });
        this._userid = response.Body.UserID;
        this._authtoken = response.Body.Token;
        this.user = new user_1.ClientUser(this, response.Body);
    }
    async likePost(postid) {
        await this._message("LikePost", { PostID: postid });
    }
    /**
     * Sign out.
     */
    async signout() {
        const body = (await this._message("LogoutAccount")).Body;
        this.user = undefined;
        this._userid = undefined;
        this._authtoken = undefined;
        return body;
    }
    /**
     *
     * @param authtoken
     */
    constructor(credentials, configuration) {
        this.logSocketMessages = configuration?.logSocketMessages || false;
        this.chatDelay = configuration?.chatDelay || 1000;
        this._socket = new ws_1.default(SOCKET_URL);
        this._socket.onmessage = (rawMessage) => {
            if (rawMessage.data === "pong")
                return;
            const message = JSON.parse(rawMessage.data.toString());
            if (this.logSocketMessages) {
                console.log("RECEIVE", message);
            }
            if (message.Metadata.ReqSource === "Client") {
                this.awaitingMessages[message.Metadata.SentMetadata.ReqID](message);
                delete this.awaitingMessages[message.Metadata.SentMetadata.ReqID];
            }
            else if (message.Metadata.ReqSource === "Server") {
                if (message.Body.ClientFunction === "DisplayNewPostMessage") {
                    const NewPostData = message.Body.NewPostData;
                    this._newPosts[NewPostData._id] = true;
                    this._getPosts();
                }
                else if (message.Body.ClientFunction === "NewChatRecieve") {
                    const { Users, Chats } = message.Body;
                    this._processUsers(Users);
                    this._processChats(Chats);
                    for (const rawChat of Chats) {
                        this._posts[rawChat.PostID]._chatListeners.forEach((callback) => {
                            callback(this._chats[rawChat._id]);
                        });
                    }
                }
                else {
                    console.warn("Received a socket message from Server with an unrecognized ClientFunction");
                    console.warn({
                        rawMessage,
                        message,
                        ClientFunction: message.Body.ClientFunction,
                    });
                }
            }
        };
        this._socket.onopen = () => {
            this._init(credentials);
        };
    }
}
exports.Client = Client;
