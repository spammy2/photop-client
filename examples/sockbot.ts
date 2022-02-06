// sockbot.ts has been moved to github.com/spammy2/sockbot

import { Chat, Client, Post } from "..";
import { config } from "dotenv";

config();

const client = new Client(
	{ username: process.env.USERNAME!, password: process.env.PASSWORD! },
	{ logSocketMessages: false }
);

const help = {
	like: "Likes a post",
	unlike: "Unlike a post",
	ping: "Sends back pong.",
	post: "sb!post {message} Posts a message",
	echo: "sb!echo {message} Sends a message",
	reply: "sb!reply {message} Replies with a message",
	disconnect: "{perms>=1} Stop listening for commands in current post.",
	follow: "sb!follow {username} Follows a user by their username",
	unfollow: "sb!unfollow {username} Unfollows a user by their username",
	help: "Shows a list of commands or info on a specific command",
	about: "sb!about {topic} Gives opinion on certain things.",
	hook: "sb!hook {id} Listens to a post the same way adding +SockBot to your post would.",
	joingroup: "sb!joingroup {inviteid} Invites the bot to a group."
};

const commands: Record<
	string,
	{ func: (chat: Chat, body: string) => void; perms?: number }
> = {
	joingroup: {
		func: async (chat, body) => {
			try {
				const group = await client.joinGroup(body);
				const post = await group.post("SockBot has joined!")
				post.chat("You can invite me with sb!joingroup on a post that I am listening. (Not this one)");
				group.onPost = onPost;
				chat.reply(`Joined ${group.name}!`);
			} catch (e) {
				chat.reply(String(e));
			}
		}
	},
	leavegroup: {
		func: async (chat, body) => {
			const group = client.groups[body];
			if (group && group.members[client.userid]) {
				await group.leave();
				chat.reply("Left group")
				return;
			}
			chat.reply("Not part of group.")
		},
		perms: 1,
	},
	like: {
		func: (chat) => {
			chat.post.like();
		},
	},
	unlike: {
		func: (chat) => {
			chat.post.unlike();
		},
	},
	ping: {
		func: (chat) => {
			chat.reply("Pong");
		},
	},
	post: {
		func: (chat, body) => {
			client.post(body);
		},
	},
	echo: {
		func: (chat, body) => {
			if (body === "") {
				chat.reply("Cannot send an empty message. Ex: sb!echo test");
			} else {
				chat.post.chat(body);
			}
		},
	},
	follow: {
		func: async (chat, body) => {
			const user = await client.getUserFromUsername(body);
			if (!user) return chat.reply("User not found")
			user.follow().then((success) => {
				if (success) {
					chat.reply(`Followed ${user!.username}`);
				} else {
					chat.reply(`Failed to follow ${user!.username}. (May already be following)`)
				}
			});
		},
	},
	unfollow: {
		func: async (chat, body) => {
			const user = await client.getUserFromUsername(body);
			if (!user) return chat.reply("User not found")
			user.follow().then((success) => {
				if (success) {
					chat.reply(`Followed ${user!.username}`);
				} else {
					chat.reply(`Failed to unfollow ${user!.username}. (May already not be following)`)
				}
			});
		},
	},
	reply: {
		func: (chat, body) => {
			if (body === "") {
				chat.reply(
					"Cannot reply with an empty message. Ex: sb!reply test"
				);
			} else {
				chat.reply(body);
			}
		},
	},
	disconnect: {
		func: (chat) => {
			chat.post.disconnect();
			chat.post.chat(
				"SockBot disconnected. Reason: Disconnected by user."
			);
		},
		perms: 1,
	},
	help: {
		func: (chat, body) => {
			if (body === "") {
				chat.reply(
					Object.keys(help).join(", ") +
						". You can use sb!help {command} to get more info."
				);
			} else if (body in help) {
				chat.reply(help[body as keyof typeof help]);
			} else {
				chat.reply(`not found: "${body}"`);
			}
		},
	},
	hook: {
		func: async (chat, body) => {
			let post = await client.getPost(body);
			if (post) {
				hookPost(post);
			}
		},
	},
	about: {
		func: (chat, body) => {
			if (body.toLowerCase().match("abicambot")) {
				chat.reply("Doesn't even work");
			} else if (body.toLowerCase().match("sockbot")) {
				chat.reply("amazing bot");
			} else if (body.toLowerCase().match("pyx")) {
				chat.reply("what even is that lmao");
			} else if (body.toLowerCase().match("wutbot")) {
				chat.reply("go away");
			} else {
				chat.reply(
					"Doesn't seem like i recognize what that is. Try asking about abicambot"
				);
			}
		},
	},
};

function handleCommand(chat: Chat, command: string) {
	const args = command.match(/([A-Za-z]+)(.*)/);
	if (args) {
		const cmd = args[1].toLowerCase();
		const body = args[2].substring(1);

		const commandObj = commands[cmd];
		if (commandObj) {
			const perm = commandObj.perms || 0;
			if (perm === 0) {
				commandObj.func(chat, body);
			} else if (perm === 1) {
				if (
					chat.user.roles.indexOf("Owner") > 0 ||
					chat.user.roles.indexOf("Developer") > 0 ||
					chat.user.id === "61b4520e4ea86c6fe9800c3b"
				) {
					commandObj.func(chat, body);
				} else {
					chat.reply("Permission required");
				}
			}
		} else {
			chat.reply(`Commant not found ${cmd}`);
		}
	} else {
		chat.post.chat("Bad Command");
	}
}

async function hookPost(post: Post) {
	post.chat("SockBot is listening. Run sb!help for a list of commands");
	const setBack = await post.connect(60000, () => {
		post.chat("SockBot disconnected. Reason: Inactivity");
	});
	post.onChat = (chat) => {
		setBack();
		if (chat.text.startsWith("sb!") && chat.user!==client.user) {
			handleCommand(chat, chat.text.substring(3).trim());
		}
	};
}

function onPost(post: Post){
	if (post.author.username === "Placedropper") {
		post.chat("Cringe")
		return;
	}

	if (post.text.match(/\+SockBot/i)) {
		hookPost(post);
	}
	
	if (post.text.match(/sb\![a-zA-Z0-9]/)) {
		post.chat(
			"SockBot does not support running commands via posts. Append +SockBot to your post first, then run command as a chat.."
		);
	}
}

//client.onPost = onPost;

client.onReady = async () => {
	console.log("READY!");
	//client.groups["61c7637eebb7436adbfcdc11"].onPost = onPost;
	client.onPost = onPost;
	//const post = await client.post("Hello. I am SockBot. I am an actual bot, and I actually work.");
	//const post = client.getPostFromCache("61c6dffae1e6417b595d63d1")
	//hookPost(post);
};

console.log("running sockbot");