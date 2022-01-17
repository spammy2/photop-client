"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientUser = exports.User = void 0;
class User {
    _network;
    createdAt;
    id;
    avatarUrl;
    username;
    roles;
    _clientUserIsFollowing = false;
    /**
     * Gets a user's post history
     */
    getPosts() {
        throw new Error("Not Implemented");
    }
    /**
     * Gets a user's chat history
     */
    getChats() {
        throw new Error("Not Implemented");
    }
    async follow() {
        // do not try to follow if they are already being followed by the user
        if (this._clientUserIsFollowing)
            return false;
        try {
            await this._network.message("FollowUser", {
                FollowUserID: this.id,
            });
            this._clientUserIsFollowing = true;
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async unfollow() {
        if (this._clientUserIsFollowing === false)
            return false;
        try {
            await this._network.message("UnfollowUser", { UnfollowUserID: this.id });
            this._clientUserIsFollowing = false;
            return true;
        }
        catch (e) {
            return false;
        }
    }
    following = [];
    _isLoadingFollowingUsers = false;
    async loadFollowingUsers() {
        if (this._isLoadingFollowingUsers) {
            throw new Error("Already getting followed users");
        }
        this._isLoadingFollowingUsers = true;
        this.following = []; //clear following so there are no duplicates
        let before = undefined;
        while (true) {
            const response = await this._network.message("GetFollowData", {
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
    constructor(_network, /* public */ raw) {
        this._network = _network;
        this.createdAt = new Date(raw.CreationTime || parseInt(raw._id.substring(0, 8), 16) * 1000);
        this.id = raw._id;
        this.avatarUrl = raw.Settings?.ProfilePic;
        this.username = raw.User;
        this.roles = raw.Role || [];
    }
}
exports.User = User;
class ClientUser extends User {
    raw;
    email;
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
}
exports.ClientUser = ClientUser;
