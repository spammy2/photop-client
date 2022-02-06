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
exports.Group = exports.GroupInviteType = void 0;
const groupuser_1 = require("./groupuser");
var GroupInviteType;
(function (GroupInviteType) {
    GroupInviteType[GroupInviteType["Self"] = 0] = "Self";
    GroupInviteType[GroupInviteType["Anyone"] = 1] = "Anyone";
    GroupInviteType[GroupInviteType["Unknown"] = 2] = "Unknown";
})(GroupInviteType = exports.GroupInviteType || (exports.GroupInviteType = {}));
class Group {
    constructor(_network, raw) {
        this._network = _network;
        /** TODO: implement this */
        this.clientIsInGroup = true;
        this.members = {};
        this.onUserJoined = (user) => { };
        this.onUserLeft = (user) => { };
        this.onDeleted = () => { };
        this.id = raw._id;
        this.createdAt = new Date(raw.Timestamp);
        this.timestamp = raw.Timestamp;
        this.name = raw.Name;
        this.icon = raw.Icon;
        this.inviteType = GroupInviteType[raw.Invite];
        this._network.simpleSocket.subscribeEvent({ Task: "GroupUpdate", GroupID: this.id }, (data) => {
            if (data.Type === "MemberUpdate") {
                if (data.Member.Status === -1) {
                    const groupUser = this.members[data.Member._id];
                    delete this.members[data.Member._id];
                    this.onUserLeft(groupUser);
                }
                else {
                    if (this.members[data.Member._id]) {
                        this.members[data.Member._id].user.updateRaw(data.Member);
                        this.members[data.Member._id].status = data.Member.Status;
                    }
                    else {
                        this._network.processUsers([data.Member]);
                        this.members[data.Member._id] = new groupuser_1.GroupUser(this._network, this, this._network.users[data.Member._id], data.Member);
                        this.onUserJoined(this.members[data.Member._id]);
                    }
                }
            }
            else if (data.Type === "NewPostAdded") {
                this._network.getPosts({ groupid: this.id });
            }
            else if (data.Type === "Delete") {
                delete this._network.groups[this.id];
                this._network.onGroupsChanged();
                this.onDeleted();
            }
        });
        this.onReadyPromise = new Promise((res, rej) => {
            this._network.message("GetGroupMembers", { GroupID: this.id }).then((response) => {
                this._network.processUsers(response.Body.Members);
                response.Body.Members.forEach(raw => {
                    if (!this.members[raw._id]) {
                        this.members[raw._id] = new groupuser_1.GroupUser(this._network, this, this._network.users[raw._id], raw);
                    }
                });
                this.owner = this.members[raw.Owner];
                this._network.getPosts({ groupid: this.id, initial: true }).then(() => {
                    res();
                });
            });
        });
    }
    /** Leave this group */
    leave() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._network.message("LeaveGroup", { GroupID: this.id });
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Not Implemented");
        });
    }
    /**
     * Create a post with text. Images do not seem to work at the present.
     */
    post(text, medias = [], configuration = []) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._network.post(text, this.id, medias, configuration);
        });
    }
}
exports.Group = Group;
//# sourceMappingURL=group.js.map