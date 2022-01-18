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
exports.Post = void 0;
const html_entities_1 = require("html-entities");
class Post {
    /**
     * @internal Do not create
     */
    constructor(_network, raw, author) {
        this._network = _network;
        this.raw = raw;
        this.author = author;
        this.usersLiked = [];
        this._connected = false;
        this._currentConnection = 0;
        /**
         * Subscribe to when a chat is made. Use `Post.connect()` before subscribing.
         */
        this.onChat = (chat) => { };
        this.createdAt = new Date(this.raw.Timestamp);
        this.text = (0, html_entities_1.decode)(raw.Text);
        this.chatCount = raw.Chats || 0;
        this.likes = raw.Likes || 0;
        this.chats = [];
        this.id = raw._id;
        if (raw.GroupID) {
            this.group = this._network.groups[raw.GroupID];
        }
    }
    _onChat(chat) {
        if (this._connected) {
            this.onChat(chat);
        }
    }
    connect(disconnectAfter, onDisconnect) {
        return __awaiter(this, void 0, void 0, function* () {
            let connection = ++this._currentConnection;
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
        });
    }
    /**
     * Stop listening to chats from this post
     */
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            this._connected = false;
            this._network.disconnectChat(this.id);
        });
    }
    /**
     * Likes a post. The like count will not be updated.
     */
    like() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._network.message("LikePost", { PostID: this.id });
        });
    }
    /**
     * Unlikes a post. The like count will not be updated.
     */
    unlike() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._network.message("UnlikePost", { PostID: this.id });
        });
    }
    /**
     * Creates a chat on the target post.
     */
    chat(text) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._network.chat(this.id, text);
        });
    }
    /**
     * Deletes a post.
     * Warning: you can only delete your only posts.
     * This will error if it isn't your post.
     */
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._network.message("UpdatePost", {
                Task: "Delete",
                PostID: this.id,
            });
        });
    }
    /**
     * Pins a post. Can only pin your own.
     */
    pin() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._network.message("UpdatePost", {
                Task: "PinProfile",
                PostID: this.id,
            });
        });
    }
    /**
     * Pins a post. Can only unpin your own.
     */
    unpin() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._network.message("UpdatePost", {
                Task: "UnpinProfile",
                PostID: this.id,
            });
        });
    }
}
exports.Post = Post;
