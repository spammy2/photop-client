"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientUser = exports.User = void 0;
class User {
    client;
    createdAt;
    id;
    avatarUrl;
    username;
    roles;
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
    /**
     * @private Used for updating the details when they update ex: username after the initial creation
     */
    update(raw) {
        // this.raw = raw;
        this.avatarUrl = raw.Settings?.ProfilePic;
        this.username = raw.User;
        this.roles = raw.Role || [];
    }
    constructor(client, /* public */ raw) {
        this.client = client;
        this.createdAt = new Date(raw.CreationTime);
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
    constructor(client, raw) {
        super(client, {
            Settings: raw.Settings,
            CreationTime: 0,
            Role: raw.Role,
            _id: "UserID" in raw ? raw.UserID : raw._id,
            User: "RealUser" in raw ? raw.RealUser : raw.User,
        });
        this.raw = raw;
        this.email = raw.Email;
    }
}
exports.ClientUser = ClientUser;
