"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Network = void 0;
const chat_1 = require("./chat");
const post_1 = require("./post");
const user_1 = require("./user");
const ws_1 = require("ws");
const simplesocket_1 = __importDefault(require("./vendor/simplesocket"));
const group_1 = require("./group");
const SOCKET_URL = "wss://api.photop.live/Server1";
const IMAGE_UPLOAD_URL = "https://api.photop.live:3000/ImageUpload";
class Network {
    constructor(credentials, config) {
        var _a, _b;
        this.config = config;
        this.simpleSocket = simplesocket_1.default;
        //readonly newPosts: Record<string, boolean> = {};
        this.awaitingMessages = {};
        this.posts = {};
        this.chats = {};
        this.users = {};
        this.groups = {};
        this.connectedChats = [];
        this.onPost = (post) => { };
        this.onReady = () => { };
        this.fingerprint = "25010157537369604664110537365900144030"; // useless fingerprint lol
        this.chatQueue = [];
        this.isProcessing = false;
        this.reqid = 0;
        this.chatDelay = (config === null || config === void 0 ? void 0 : config.chatDelay) || 2000;
        this.socket = new ws_1.WebSocket(SOCKET_URL);
        const simpleSocketPromise = this.simpleSocket.connect({
            project_id: "61b9724ea70f1912d5e0eb11",
            client_token: "client_a05cd40e9f0d2b814249f06fbf97fe0f1d5",
        });
        this.simpleSocket.debug = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.logSocketMessages) !== null && _b !== void 0 ? _b : false;
        this.socket.onmessage = (rawMessage) => {
            var _a;
            if (rawMessage.data === "pong")
                return;
            const message = JSON.parse(rawMessage.data.toString());
            if ((_a = this.config) === null || _a === void 0 ? void 0 : _a.logSocketMessages) {
                console.log("RECEIVE", message);
            }
            if (message.Metadata.ReqSource === "Client") {
                this.awaitingMessages[message.Metadata.SentMetadata.ReqID](message);
                delete this.awaitingMessages[message.Metadata.SentMetadata.ReqID];
            }
            else if (message.Metadata.ReqSource === "Server") {
                if (message.Body.ClientFunction === "NewChatRecieve") {
                    const { Users, Chats } = message.Body;
                    this.processUsers(Users);
                    this.processChats(Chats);
                    for (const rawChat of Chats) {
                        this.posts[rawChat.PostID]._onChat(this.chats[rawChat._id]);
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
        this.socket.onopen = () => {
            simpleSocketPromise.then(() => {
                this._init(credentials);
            });
        };
    }
    post(text, groupid, medias, configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = {
                Text: text,
                Configuration: configuration,
                Media: {},
            };
            if (groupid) {
                body.GroupID = groupid;
            }
            if (medias.length > 0) {
                body.Media.ImageCount = medias.length;
            }
            const response = yield this.message("CreatePost", body);
            if (medias.length > 0) {
                const data = new FormData();
                data.append("RequestData", JSON.stringify({
                    AccountData: {
                        AuthToken: this.authtoken,
                        UserID: this.userid,
                        Fingerprint: this.fingerprint,
                    },
                    Metadata: { PostID: response.Body.NewPostID },
                }));
                for (let i = 0; i < medias.length; i++) {
                    data.append(`File${i}`, medias[i]);
                }
                yield fetch(IMAGE_UPLOAD_URL, {
                    method: "POST",
                    body: data,
                });
            }
            yield this.getPosts(undefined, undefined, groupid);
            ;
            return this.posts[response.Body.NewPostID];
        });
    }
    getPosts(amount = 15, before, groupid, initial = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.message("GetPosts", Object.assign(Object.assign(Object.assign({}, (groupid ? { GroupID: groupid } : {})), { Amount: amount }), (before ? { Before: before } : {})));
            this.processUsers(response.Body.Users);
            const posts = response.Body.Posts.map((rawPost) => {
                return new post_1.Post(this, rawPost, this.users[rawPost.UserID]);
            });
            for (const post of posts) {
                if (!(post.id in this.posts)) {
                    this.posts[post.id] = post;
                    if (!initial) {
                        if (groupid) {
                            this.groups[groupid].onPost(post);
                        }
                        else {
                            this.onPost(post);
                        }
                    }
                }
            }
            if (Array.isArray(response.Body.Likes)) {
                for (const like of response.Body.Likes) {
                    const postid = like._id.substring(0, posts[0].id.length);
                    const userid = like._id.substring(postid.length);
                    this.posts[postid].usersLiked.push({
                        user: this.users[userid],
                        raw: like,
                        likedAt: new Date(like.Timestamp),
                    });
                }
            }
            return posts;
        });
    }
    connectChat(postid) {
        return __awaiter(this, void 0, void 0, function* () {
            this.connectedChats.push(postid);
            // no idea why they are separate but not something we care about
            const response = yield this.message("ConnectLiveChat", {
                Amount: 25,
                Posts: this.connectedChats,
                ChatPosts: this.connectedChats,
            });
            this.processUsers(response.Body.Users);
            this.processChats(response.Body.Chats);
        });
    }
    disconnectChat(postid) {
        return __awaiter(this, void 0, void 0, function* () {
            this.connectedChats = this.connectedChats.filter((id) => id !== postid);
        });
    }
    processUsers(rawUsers) {
        let processed = [];
        for (const rawUser of rawUsers) {
            if (rawUser._id in this.users) {
                this.users[rawUser._id].update(rawUser);
            }
            else {
                this.users[rawUser._id] = new user_1.User(this, rawUser);
            }
            processed.push(this.users[rawUser._id]);
        }
        return processed;
    }
    reply(text, postid, replyid, groupid) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res, rej) => {
                this.chatQueue.push({ postid, replyid, groupid, text, res, rej });
                if (!this.isProcessing) {
                    this.next();
                }
            });
        });
    }
    chat(text, postid, groupid) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((res, rej) => {
                this.chatQueue.push({ postid, text, res, rej, groupid });
                if (!this.isProcessing) {
                    this.next();
                }
            });
        });
    }
    next() {
        const first = this.chatQueue.shift();
        if (first) {
            this.isProcessing = true;
            this._chat(first.text, first.postid, first.replyid, first.groupid)
                .then((chat) => {
                first.res(chat);
                setTimeout(this.next.bind(this), this.chatDelay);
            })
                .catch(() => {
                console.log("Error: Throttled?");
                setTimeout(this.next.bind(this), this.chatDelay);
            });
        }
        else {
            this.isProcessing = false;
        }
    }
    _chat(text, postid, replyid, groupid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (text === "") {
                throw new Error("Can't send empty messages");
            }
            const response = yield this.message("CreateChat", {
                GroupID: groupid,
                PostID: postid,
                ReplyID: replyid,
                Text: text,
            });
            return new chat_1.Chat(this, this.user, this.posts[postid], {
                Text: text,
                _id: response.Body.NewChatID,
                GroupID: groupid,
                UserID: this.userid,
                ReplyID: replyid,
                PostID: postid,
                Timestamp: 0, // the response for CreateChat does not include the timestamp, so we must wait for NewChatReceive in order to
            });
        });
    }
    processChats(rawChats) {
        for (const rawChat of rawChats) {
            if (rawChat._id in this.chats) {
                this.chats[rawChat._id].update(rawChat);
            }
            else {
                const chat = new chat_1.Chat(this, this.users[rawChat.UserID], this.posts[rawChat.PostID], rawChat);
                this.posts[rawChat.PostID].chats.push(chat);
                this.chats[rawChat._id] = chat;
            }
        }
        //we do it again because some of the chats may be registered before the ones they are replying to are
        for (const rawChat of rawChats) {
            if (rawChat.ReplyID) {
                this.chats[rawChat._id].replyTo = this.chats[rawChat.ReplyID];
            }
        }
    }
    authenticate(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.message("SignInAccount", {
                Username: username,
                Password: password,
            });
            this.userid = response.Body.UserID;
            this.authtoken = response.Body.Token;
            this.user = new user_1.ClientUser(this, response.Body);
        });
    }
    onGroupsChanged() {
        if (this.generalUpdateSub) {
            this.simpleSocket.editSubscribe(this.generalUpdateSub, { Task: "GeneralUpdate", Location: "Home", Groups: Object.keys(this.groups), UserID: this.userid });
        }
    }
    _init(credentials) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let a = yield this.message("CreateConnection");
            if (credentials) {
                if ("username" in credentials) {
                    yield this.authenticate(credentials.username, credentials.password);
                }
                else if ("token" in credentials) {
                    this.authtoken = credentials.token;
                    this.userid = credentials.userid;
                    this.fingerprint = credentials.fingerprint;
                    yield this.message("GetAccountData");
                }
                else {
                    console.warn("Credentials were provided but they are not username-password or token-userid. Falling back to 'guest' mode");
                }
            }
            yield this.getPosts(undefined, undefined, undefined, true);
            if (((_a = this.config) === null || _a === void 0 ? void 0 : _a.disableGroups) !== true) {
                const getGroupsResponse = yield this.message("GetGroups", {});
                // Body.Owners is unnecessary because we are already fetching the members of the group;
                this.processUsers(getGroupsResponse.Body.Owners);
                for (const rawGroup of getGroupsResponse.Body.Groups) {
                    this.groups[rawGroup._id] = new group_1.Group(this, rawGroup);
                    yield this.groups[rawGroup._id].onReadyPromise;
                }
            }
            this.generalUpdateSub = this.simpleSocket.subscribeEvent({ Task: "GeneralUpdate", Location: "Home", Groups: Object.keys(this.groups), UserID: this.userid }, (Data) => {
                if (Data.Type === "NewPostAdded") {
                    const NewPostData = Data.NewPostData;
                    //this.newPosts[NewPostData._id] = true;
                    this.getPosts(undefined, undefined, NewPostData.GroupID);
                }
            });
            this.onReady();
        });
    }
    message(task, body) {
        return new Promise((res, rej) => {
            var _a;
            const message = {
                Body: body,
                Metadata: Object.assign(Object.assign({}, (this.authtoken
                    ? {
                        AuthToken: this.authtoken,
                        UserID: this.userid,
                    }
                    : {})), { ReqID: this.reqid, ReqTask: task, 
                    // After careful review from Photop Client staff, we have determined that fingerprint is very useless
                    // The length is completely arbitrary and we can substitute this for a random number generator
                    Fingerprint: this.fingerprint }),
            };
            if ((_a = this.config) === null || _a === void 0 ? void 0 : _a.logSocketMessages) {
                console.log("SEND", message);
            }
            this.socket.send(JSON.stringify(message));
            this.awaitingMessages[this.reqid] = (result) => {
                if (result.Body.Code !== 200) {
                    rej(result.Body.Message);
                }
                else {
                    res(result);
                }
            };
            this.reqid++;
        });
    }
    signout() {
        return __awaiter(this, void 0, void 0, function* () {
            const body = (yield this.message("LogoutAccount")).Body;
            this.user = undefined;
            this.userid = undefined;
            this.authtoken = undefined;
            return body;
        });
    }
}
exports.Network = Network;
