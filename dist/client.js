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
exports.Client = void 0;
const network_1 = require("./network");
const user_1 = require("./user");
const cross_fetch_1 = __importDefault(require("cross-fetch"));
const group_1 = require("./group");
/**
 * Represents a Photop client
 * Provides an interface of interactions that can be done by the user.
 */
class Client {
    /**
     * Create a client with one of two types of credentials.
     * {username, password} or {userid, authtoken} or none at all (this will mean you are signed out)
     */
    constructor(credentials, configuration) {
        /**
         * Handle posts here
         * This also hooks to posts made in other groups, unless disableGroups is set to true.
         * If you only want to respond to global posts, do `if (!post.group)`
         * @example
         * client.onPost((post)=>{
         * 	post.chat("Hello");
         * })
         */
        this.onPost = (post) => { };
        /*
        Called when client receives an invite.
         *
         */
        this.onInvite = (invite) => { };
        this.onReady = () => { };
        this._network = new network_1.Network(credentials, configuration);
        this._network.onPost = (post) => {
            this.onPost(post);
        };
        this._network.onInvite = (invite) => {
            this.onInvite(invite);
        };
        this._network.onReady = () => {
            this.onReady();
        };
    }
    /** Gets the user instance that belongs to this client */
    get user() {
        return this._network.user;
    }
    /** Gets the client's userid */
    get userid() {
        return this._network.userid;
    }
    /** Groups that  */
    get groups() {
        return this._network.groups;
    }
    /**
     * @deprecated
     * Retrieves a post from cache
     */
    getPostFromCache(id) {
        return this._network.posts[id];
    }
    /**
     * Gets a post. If it does not exist in cache, attempts to get it by using timestamp of the objectid.
     */
    getPost(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._network.posts[id])
                return this._network.posts[id];
            yield this._network.getPosts({
                amount: 10,
                before: parseInt(id.substring(0, 8), 16) * 1000 - 5000,
            }); //offset by 5 seconds in case the time is actually BEFORE it was posted
            return this._network.posts[id];
        });
    }
    /**
     * The short group id that is used for invitations OR the group id itself.
     * @returns Group; errors if already in group.
     */
    joinGroup(groupid) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const id = (yield this._network.message("InviteUpdate", {
                Task: "Join",
                GroupID: groupid,
            })).Body.GroupID;
            if ((_a = this._network.groups[id]) === null || _a === void 0 ? void 0 : _a.members[this.userid])
                /* return;*/ throw new Error("already in group");
            const rawGroup = (yield this._network.message("GetGroups", {
                GroupID: id,
            })).Body.Group;
            this._network.groups[rawGroup._id] = new group_1.Group(this._network, rawGroup);
            this._network.onGroupsChanged();
            return this._network.groups[rawGroup._id];
        });
    }
    getUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._network.users[id])
                return this._network.users[id];
            const data = (yield (0, cross_fetch_1.default)("https://photoprest.herokuapp.com/Users?UserId=" + id)
                .then((e) => e.json())
                .catch(() => {
                console.log("fetch to photoprest resulted in error");
            }));
            if (data.user) {
                return user_1.User.FromRaw(this._network, data.user);
            }
        });
    }
    getUserFromUsername(name) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const userid in this._network.users) {
                if (this._network.users[userid].username === name) {
                    return this._network.users[userid];
                }
            }
            const response = yield this._network.message("Search", { Type: "Users", Search: name });
            this._network.processUsers(response.Body.Result);
            for (const userid in this._network.users) {
                if (this._network.users[userid].username === name) {
                    return this._network.users[userid];
                }
            }
        });
    }
    /**
     * Create a post with text. Images do not seem to work at the present.
     */
    post(text, medias = [], configuration = []) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._network.post(text, undefined, medias, configuration);
        });
    }
    /**
     * Can switch user by passing a username and password. May not work.
     */
    authenticate(username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            this._network.authenticate(username, password);
        });
    }
    /**
     * Sign out.
     */
    signout() {
        return __awaiter(this, void 0, void 0, function* () {
            this._network.signout();
        });
    }
}
exports.Client = Client;
//# sourceMappingURL=client.js.map