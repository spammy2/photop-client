"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
class Post {
    client;
    raw;
    author;
    createdAt;
    text;
    likes;
    chatCount;
    chats;
    id;
    usersLiked = [];
    _connected = false;
    _chatListeners = [];
    async onChat(callback) {
        if (!this._connected) {
            console.warn("You need to call Post.connect() before adding listeners.");
            return;
        }
        this._chatListeners.push(callback);
    }
    async connect() {
        this._connected = true;
        this.client.connectChat(this.id);
    }
    async disconnect() {
        this._connected = false;
        this.client.disconnectChat(this.id);
    }
    async chat(text) {
        return this.client.chat(this.id, text);
    }
    /**
     * @internal Do not create
     */
    constructor(client, raw, author) {
        this.client = client;
        this.raw = raw;
        this.author = author;
        this.createdAt = new Date(this.raw.Timestamp);
        this.text = raw.Text;
        this.chatCount = raw.Chats || 0;
        this.likes = raw.Likes || 0;
        this.chats = [];
        this.id = raw._id;
    }
}
exports.Post = Post;
