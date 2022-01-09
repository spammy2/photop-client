// why am i putting sockbot.ts in source? because i dont know where to put it so it just gonna go in as well
import { Chat, Client, Post } from ".";
import { config } from "dotenv"
import fetch from "node-fetch";
config()

const client = new Client({username: process.env.USERNAME!, password: process.env.PASSWORD!}, {logSocketMessages: true})

function handleCommand(chat: Chat, command: string){
	const args = command.match(/([A-Za-z]+)(.*)/);
	if (args){
		const cmd = args[1];
		const body = args[2];
		// if (chat.user.id==="6160e942979ff73857562a19") {
		// 	chat.post.chat(`Hello ${chat.user.username}, you have been blocked from accessing SockBot because you are not very cool like me.`)
		// 	return;
		// }

		switch (cmd){
			case "like": 
				chat.post.like();
				break;
			case "unlike":
				chat.post.unlike();
				break;
			case "ping":
				chat.reply(`Pong`)
				break;
			case "post":
				client.post(body)
				break;
			case "delete":
				console.log(body);
				client.getPostFromCache(body)?.delete()
				break;
			case "echo":
				if (body==="") {
					chat.reply("Cannot send an empty message")
				} else {
					chat.post.chat(body)
				}
				break;
			case "reply":
				if (body==="") {
					chat.reply("Cannot send an empty message");
				} else {
					chat.reply(body)
				}
				break;
			case "disconnect":
				if (chat.user.roles.indexOf("Owner")>0 || chat.user.roles.indexOf("Developer")>0 || chat.user.id==="61b4520e4ea86c6fe9800c3b") {
					chat.post.disconnect();
					chat.reply("SockBot is no longer listening on this channel.");
				} else {
					chat.reply("You must have the role of Owner or Developer or be the bot developer to disconnect");
				}
				break;
			case "eval":
				/*
				if (chat.user.id==="61b4520e4ea86c6fe9800c3b") {
					chat.reply(new String(eval(body)).toString())
				}
				*/
				break;
			case "help":
				chat.reply("ping; echo; help; like; unlike; post; reply; (perms required) disconnect")
				break;
			default:
				chat.reply(`Unrecognized Command "${command}"`);
		}
	} else {
		chat.post.chat("Bad Command");
	}
}

function hookPost(post: Post){
	post.connect();
	post.chat("SockBot is listening. Run sb!help for a list of commands");
	post.onChat((chat)=>{
		if (chat.text.startsWith("sb!")){
			handleCommand(chat, chat.text.substring(3).trim())
		}
	});
}

client.onPost((post)=>{
	if (post.text.match(/\+SockBot/)) {
		hookPost(post);
	}
})

client.onReady(async ()=>{
	console.log("READY!")
	
	//const post = await client.post("Hello. I am SockBot. I am an actual bot, and I actually work.");
	//const post = client.getPostFromCache("61c6dffae1e6417b595d63d1")
	//hookPost(post);
})


