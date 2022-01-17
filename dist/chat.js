"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const html_entities_1 = require("html-entities");
class Chat {
    _network;
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
        this.text = (0, html_entities_1.decode)(raw.Text);
    }
    reply(text) {
        this._network.reply(this.post.id, this.id, text);
    }
    constructor(_network, user, post, raw, replyTo) {
        this._network = _network;
        this.user = user;
        this.post = post;
        this.raw = raw;
        this.createdAt = new Date(raw.Timestamp);
        this.id = raw._id;
        this.text = (0, html_entities_1.decode)(raw.Text);
        this.replyTo = replyTo;
    }
}
exports.Chat = Chat;
