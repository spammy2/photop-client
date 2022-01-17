"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Post = void 0;
const html_entities_1 = require("html-entities");
class Post {
    _network;
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
    _currentConnection = 0;
    _onChat(chat) {
        if (this._connected) {
            this.onChat(chat);
        }
    }
    /**
     * Subscribe to when a chat is made. Use `Post.connect()` before subscribing.
     */
    onChat = (chat) => { };
    async connect(disconnectAfter, onDisconnect) {
        let connection = this._currentConnection++;
        this._connected = true;
        this._network.connectChat(this.id);
        if (disconnectAfter) {
            let timer = setTimeout(() => {
                if (this._connected && connection === this._currentConnection) {
                    this.disconnect();
                    if (onDisconnect)
                        onDisconnect();
                }
            }, disconnectAfter);
            return () => {
                if (this._connected)
                    timer.refresh();
            };
        }
    }
    /**
     * Stop listening to chats from this post
     */
    async disconnect() {
        this._connected = false;
        this._network.disconnectChat(this.id);
    }
    /**
     * Likes a post. The like count will not be updated.
     */
    async like() {
        return this._network.message("LikePost", { PostID: this.id });
    }
    /**
     * Unlikes a post. The like count will not be updated.
     */
    async unlike() {
        return this._network.message("UnlikePost", { PostID: this.id });
    }
    /**
     * Creates a chat on the target post.
     */
    async chat(text) {
        return this._network.chat(this.id, text);
    }
    /**
     * Deletes a post.
     * Warning: you can only delete your only posts.
     * This will error if it isn't your post.
     */
    async delete() {
        return this._network.message("UpdatePost", {
            Task: "Delete",
            PostID: this.id,
        });
    }
    /**
     * Pins a post. Can only pin your own.
     */
    async pin() {
        return this._network.message("UpdatePost", {
            Task: "PinProfile",
            PostID: this.id,
        });
    }
    /**
     * Pins a post. Can only unpin your own.
     */
    async unpin() {
        return this._network.message("UpdatePost", {
            Task: "UnpinProfile",
            PostID: this.id,
        });
    }
    /**
     * @internal Do not create
     */
    constructor(_network, raw, author) {
        this._network = _network;
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
