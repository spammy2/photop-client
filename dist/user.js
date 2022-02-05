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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientUser = exports.User = void 0;
class User {
    constructor(_network, /* public */ raw) {
        var _a;
        this._network = _network;
        this._clientUserIsFollowing = false;
        this.following = [];
        this._isLoadingFollowingUsers = false;
        this.createdAt = new Date(raw.CreationTime || parseInt(raw._id.substring(0, 8), 16) * 1000);
        this.id = raw._id;
        this.avatarUrl = (_a = raw.Settings) === null || _a === void 0 ? void 0 : _a.ProfilePic;
        this.username = raw.User;
        this.roles = raw.Role || [];
    }
    /**
     * Looks up a user's post history, looks up from newest to oldest.
     * @param oldest Limits the amount of posts searched up to a certain date. By default this is 0, which means it looks up all posts.
     */
    getPosts(oldest = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            let last = yield this._network.getPosts({ userid: this.id });
            let all = [];
            for (const p of last) {
                if (p.createdAt.getTime() >= oldest) {
                    all.push(p);
                }
                else {
                    return all;
                }
            }
            while (true) {
                last = yield this._network.getPosts({ userid: this.id, before: last[last.length - 1].createdAt.getTime() });
                if (last.length === 0) {
                    return all;
                }
                for (const p of last) {
                    if (p.createdAt.getTime() >= oldest) {
                        all.push(p);
                    }
                    else {
                        return all;
                    }
                }
            }
        });
    }
    /**
     * Gets a user's chat history
     */
    getChats() {
        throw new Error("Not Implemented");
    }
    follow() {
        return __awaiter(this, void 0, void 0, function* () {
            // do not try to follow if they are already being followed by the user
            if (this._clientUserIsFollowing)
                return false;
            try {
                yield this._network.message("FollowUser", {
                    FollowUserID: this.id,
                });
                this._clientUserIsFollowing = true;
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
    unfollow() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._clientUserIsFollowing === false)
                return false;
            try {
                yield this._network.message("UnfollowUser", { UnfollowUserID: this.id });
                this._clientUserIsFollowing = false;
                return true;
            }
            catch (e) {
                return false;
            }
        });
    }
    loadFollowingUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._isLoadingFollowingUsers) {
                throw new Error("Already getting followed users");
            }
            this._isLoadingFollowingUsers = true;
            this.following = []; //clear following so there are no duplicates
            let before = undefined;
            while (true) {
                const response = yield this._network.message("GetFollowData", {
                    Amount: 50,
                    GetUserID: this.id,
                    Before: before,
                    Type: "Following",
                });
                if (response.Body.FollowUserIds.length === 0) {
                    break;
                }
                const users = [];
                const clientFollowingIds = [];
                for (const userid of response.Body.FollowUserIds) {
                    const user = response.Body.Users[userid];
                    if (!user) {
                        // i like how it sends back userids even if they are deleted
                        // congrats, robot, you made me waste even more time
                        continue;
                    }
                    if (user.IsFollowing) {
                        clientFollowingIds.push(userid);
                    }
                    user._id = userid;
                    users.push(user);
                }
                // using processUsers has the added benefit of also putting them into the cache
                const processed = this._network.processUsers(users);
                for (const userid of clientFollowingIds) {
                    this._network.users[userid]._clientUserIsFollowing = true;
                }
                this.following = [...this.following, ...processed];
                // really dude?
                before = response.Body.LastTimestamp;
            }
        });
    }
    /**
     * @private Used for updating the details when they update ex: username after the initial creation
     */
    update(raw) {
        this.username = raw.User;
        if (raw.Settings && raw.Settings.ProfilePic) {
            this.avatarUrl = raw.Settings.ProfilePic;
        }
        if (raw.Role) {
            this.roles = raw.Role || [];
        }
    }
}
exports.User = User;
class ClientUser extends User {
    constructor(network, raw) {
        super(network, {
            Settings: raw.Settings,
            Role: Array.isArray(raw.Role) || raw.Role === undefined
                ? raw.Role
                : [raw.Role],
            _id: "UserID" in raw ? raw.UserID : raw._id,
            User: "RealUser" in raw ? raw.RealUser : raw.User,
        });
        this.raw = raw;
        this.email = raw.Email;
    }
    updateClient(raw) {
        super.update({
            Settings: raw.Settings,
            Role: Array.isArray(raw.Role) || raw.Role === undefined
                ? raw.Role
                : [raw.Role],
            _id: "UserID" in raw ? raw.UserID : raw._id,
            User: "RealUser" in raw ? raw.RealUser : raw.User,
        });
        if (raw.Email) {
            this.email = raw.Email;
        }
    }
}
exports.ClientUser = ClientUser;
