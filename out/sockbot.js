"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// why am i putting sockbot.ts in source? because i dont know where to put it so it just gonna go in as well
const _1 = require(".");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const client = new _1.Client({ username: process.env.USERNAME, password: process.env.PASSWORD }, { logSocketMessages: true });
function handleCommand(chat, command) {
    const args = command.match(/([A-Za-z]+)(.*)/);
    if (args) {
        const cmd = args[1];
        const body = args[2];
        if (chat.user.id === "6160e942979ff73857562a19") {
            chat.post.chat(`Hello ${chat.user.username}, you have been blocked from accessing SockBot because you are not very cool like me.`);
            return;
        }
        switch (cmd) {
            case "ping":
                chat.reply(`Pong`);
                break;
            case "echo":
                chat.post.chat(body);
                break;
            case "reply":
                chat.reply(body);
                break;
            case "disconnect":
                if (chat.user.roles.indexOf("Owner") > 0 || chat.user.roles.indexOf("Developer") > 0 || chat.user.id === "61b4520e4ea86c6fe9800c3b") {
                    chat.post.disconnect();
                    chat.reply("SockBot is no longer listening on this channel.");
                }
                else {
                    chat.reply("You must have the role of Owner or Developer or be the bot developer to disconnect");
                }
                break;
            case "help":
                chat.reply("ping; echo; help; reply; (perms required) disconnect");
                break;
        }
    }
    else {
        chat.post.chat("Bad Command");
    }
}
function hookPost(post) {
    post.connect();
    post.chat("SockBot is listening. Run sb!help for a list of commands");
    post.onChat((chat) => {
        if (chat.text.startsWith("sb!")) {
            handleCommand(chat, chat.text.substring(3).trim());
        }
    });
}
client.onPost((post) => {
    if (post.text.match(/\+SockBot/)) {
        hookPost(post);
    }
});
client.onReady(async () => {
    console.log("READY!");
    //const post = await client.post("Hello. I am SockBot. I am an actual bot, and I actually work.");
    //const post = client.getPostFromCache("61c6dffae1e6417b595d63d1")
    //hookPost(post);
});
