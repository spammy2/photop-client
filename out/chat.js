"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
class Chat {
    client;
    user;
    post;
    raw;
    createdAt;
    id;
    text;
    replyTo;
    /**
     * Update is for when some values are unknown at instantiation time
     */
    update(raw) {
        this.raw = raw;
        this.createdAt = new Date(raw.Timestamp);
        this.id = raw._id;
        this.text = raw.Text;
    }
    reply(text) {
        this.client.reply(this.post.id, this.id, text);
    }
    constructor(client, user, post, raw, replyTo) {
        this.client = client;
        this.user = user;
        this.post = post;
        this.raw = raw;
        this.createdAt = new Date(raw.Timestamp);
        this.id = raw._id;
        this.text = raw.Text;
        this.replyTo = replyTo;
    }
}
exports.Chat = Chat;
