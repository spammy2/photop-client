const { Chat, Client, Post } = require("..");
require("dotenv").config();

const client = new Client(
	{ username: process.env.USERNAME, password: process.env.PASSWORD },
	{ logSocketMessages: true }
);

client.onReady=async ()=>{
	const group = client.groups["61e66551a41bf0066a6a8abd"]
	group.onGroupPost = (post)=>{
		console.log(`A post was made ${post.text}`)
	}
	const post = await group.post("I like turtles");
	post.connect();
	post.onChat = (chat)=>{
		chat.reply(chat.text)
	}
}

module.exports = {client}