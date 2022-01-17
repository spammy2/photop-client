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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
// why am i putting sockbot.ts in source? because i dont know where to put it so it just gonna go in as well
var __1 = require("..");
var dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
var client = new __1.Client({ username: process.env.USERNAME, password: process.env.PASSWORD }, { logSocketMessages: false });
var help = {
    like: "Likes a post",
    unlike: "Unlike a post",
    ping: "Sends back pong.",
    post: "Posts a message",
    echo: "Sends a message",
    reply: "Replies with a message",
    disconnect: "{perms>=1} Stop listening for commands in current post.",
    help: "Shows a list of commands or info on a specific command",
    about: "Gives opinion on certain things."
};
var commands = {
    like: {
        func: function (chat) {
            chat.post.like();
        }
    },
    unlike: {
        func: function (chat) {
            chat.post.unlike();
        }
    },
    ping: {
        func: function (chat) {
            chat.reply("Pong");
        }
    },
    post: {
        func: function (chat, body) {
            client.post(body);
        }
    },
    echo: {
        func: function (chat, body) {
            if (body === "") {
                chat.reply("Cannot send an empty message. Ex: sb!echo test");
            }
            else {
                chat.post.chat(body);
            }
        }
    },
    reply: {
        func: function (chat, body) {
            if (body === "") {
                chat.reply("Cannot reply with an empty message. Ex: sb!reply test");
            }
            else {
                chat.reply(body);
            }
        }
    },
    disconnect: {
        func: function (chat) {
            chat.post.disconnect();
            chat.post.chat("SockBot disconnected. Reason: Disconnected by user.");
        },
        perms: 1
    },
    help: {
        func: function (chat, body) {
            if (body === "") {
                chat.reply(Object.keys(help).join(", "));
            }
            else if (body in help) {
                chat.reply(help[body]);
            }
        }
    },
    hook: {
        func: function (chat, body) { return __awaiter(void 0, void 0, void 0, function () {
            var post;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, client.getPost(body)];
                    case 1:
                        post = _a.sent();
                        if (post) {
                            hookPost(post);
                        }
                        return [2 /*return*/];
                }
            });
        }); }
    },
    about: {
        func: function (chat, body) {
            if (body.toLowerCase().match("abicambot")) {
                chat.reply("Doesn't even work");
            }
            else if (body.toLowerCase().match("sockbot")) {
                chat.reply("amazing bot");
            }
            else if (body.toLowerCase().match("pyx")) {
                chat.reply("what even is that lmao");
            }
            else if (body.toLowerCase().match("wutbot")) {
                chat.reply("go away");
            }
            else {
                chat.reply("Doesn't seem like i recognize what that is. Try asking about abicambot");
            }
        }
    }
};
function handleCommand(chat, command) {
    var args = command.match(/([A-Za-z]+)(.*)/);
    if (args) {
        var cmd = args[1].toLowerCase();
        var body = args[2];
        var commandObj = commands[cmd];
        if (commandObj) {
            var perm = commandObj.perms || 0;
            if (perm === 0) {
                commandObj.func(chat, body);
            }
            else if (perm === 1) {
                if (chat.user.roles.indexOf("Owner") > 0 ||
                    chat.user.roles.indexOf("Developer") > 0 ||
                    chat.user.id === "61b4520e4ea86c6fe9800c3b") {
                    commandObj.func(chat, body);
                }
                else {
                    chat.reply("Permission required");
                }
            }
        }
        else {
            chat.reply("Commant not found " + cmd);
        }
    }
    else {
        chat.post.chat("Bad Command");
    }
}
function hookPost(post) {
    return __awaiter(this, void 0, void 0, function () {
        var setBack;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("trying to chatto");
                    post.chat("SockBot is listening. Run sb!help for a list of commands");
                    return [4 /*yield*/, post.connect(20000, function () {
                            post.chat("SockBot disconnected. Reason: Inactivity");
                        })];
                case 1:
                    setBack = _a.sent();
                    post.onChat = function (chat) {
                        setBack();
                        if (chat.text.startsWith("sb!")) {
                            handleCommand(chat, chat.text.substring(3).trim());
                        }
                    };
                    return [2 /*return*/];
            }
        });
    });
}
client.onPost = function (post) {
    if (post.text.match(/\+SockBot/)) {
        hookPost(post);
    }
    if (post.text.match(/sb\![a-zA-Z0-9]/)) {
        post.chat("SockBot does not support running commands via posts. Append +SockBot to your post first, then run command as a chat..");
    }
};
client.onReady = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.log("READY!");
        return [2 /*return*/];
    });
}); };
