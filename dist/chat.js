"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const html_entities_1 = require("html-entities");
class Chat {
    constructor(_network, user, post, raw, replyTo) {
        this._network = _network;
        this.user = user;
        this.post = post;
        this.raw = raw;
        this.onDeleted = () => { };
        this.createdAt = new Date(raw.Timestamp);
        this.timestamp = raw.Timestamp;
        this.id = raw._id;
        this.text = (0, html_entities_1.decode)(raw.Text);
        this.replyTo = replyTo;
        if (raw.GroupID) {
            this.group = this._network.groups[raw.GroupID];
        }
    }
    /**
     * Update is for when some values are unknown at instantiation time
     */
    update(raw) {
        this.raw = raw;
        this.timestamp = raw.Timestamp;
        this.createdAt = new Date(raw.Timestamp);
        this.id = raw._id;
        this.text = (0, html_entities_1.decode)(raw.Text);
    }
    reply(text) {
        var _a;
        this._network.reply(text, this.post.id, this.id, (_a = this.group) === null || _a === void 0 ? void 0 : _a.id);
    }
}
exports.Chat = Chat;
