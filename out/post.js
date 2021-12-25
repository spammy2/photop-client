"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
const html_entities_1 = require("html-entities");
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
    async like() {
        return this.client.likePost(this.id);
    }
    async unlike() {
        return this.client.unlikePost(this.id);
    }
    async chat(text) {
        return this.client.chat(this.id, text);
    }
    /**
     * Deletes a post.
     * Warning: you can only delete your only posts.
     * This will error if it isn't your post.
     */
    async delete() {
        return this.client.deletePost(this.id);
    }
    /**
     * Pins a post. Can only pin your own.
     */
    async pin() {
        return this.client.pinPost(this.id);
    }
    /**
     * Pins a post. Can only unpin your own.
     */
    async unpin() {
        return this.client.unpinPost(this.id);
    }
    /**
     * @internal Do not create
     */
    constructor(client, raw, author) {
        this.client = client;
        this.raw = raw;
        this.author = author;
        this.createdAt = new Date(this.raw.Timestamp);
        this.text = (0, html_entities_1.decode)(raw.Text);
        this.chatCount = raw.Chats || 0;
        this.likes = raw.Likes || 0;
        this.chats = [];
        this.id = raw._id;
    }
}
exports.Post = Post;
