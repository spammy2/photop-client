// why am i putting sockbot.ts in source? because i dont know where to put it so it just gonna go in as well
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
	post: "Posts a message",
	echo: "Sends a message",
	reply: "Replies with a message",
	disconnect: "{perms>=1} Stop listening for commands in current post.",
	help: "Shows a list of commands or info on a specific command",
	about: "Gives opinion on certain things.",
};

const commands: Record<
	string,
	{ func: (chat: Chat, body: string) => void; perms?: number }
> = {
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
	reply: {
		func: (chat, body) => {
			if (body === "") {
				chat.reply("Cannot reply with an empty message. Ex: sb!reply test");
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
				chat.reply(Object.keys(help).join(", "));
			} else if (body in help) {
				chat.reply(help[body as keyof typeof help]);
			}
		},
	},
	hook: {
		func: async (chat, body)=>{
			let post = await client.getPost(body);
			if (post) {
				hookPost(post);
			}
		}
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
		const body = args[2];

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
	console.log("trying to chatto");
	post.chat("SockBot is listening. Run sb!help for a list of commands");
	const setBack = await post.connect(20000, () => {
		post.chat("SockBot disconnected. Reason: Inactivity");
	});
	post.onChat = (chat) => {
		setBack();
		if (chat.text.startsWith("sb!")) {
			handleCommand(chat, chat.text.substring(3).trim());
		}
	};
}

client.onPost = (post) => {
	if (post.text.match(/\+SockBot/)) {
		hookPost(post);
	}
	if (post.text.match(/sb\![a-zA-Z0-9]/)) {
		post.chat("SockBot does not support running commands via posts. Append +SockBot to your post first, then run command as a chat..");
	}
};

client.onReady = async () => {
	console.log("READY!");

	//const post = await client.post("Hello. I am SockBot. I am an actual bot, and I actually work.");
	//const post = client.getPostFromCache("61c6dffae1e6417b595d63d1")
	//hookPost(post);
};
