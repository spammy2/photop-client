const { Chat, Client, Post } = require("..");
require("dotenv").config();

const client = new Client(
	{ username: process.env.USERNAME, password: process.env.PASSWORD },
	{ logSocketMessages: false }
);

// Kick user bot
client.onReady=async ()=>{
	
	const group = await client.joinGroup("ad67e659");
	const post = await group.post("hello world");
	const chat = await post.chat("erm okays");
	// const group = client.groups["61e64216a41bf0066a6a49da"];
	// group.onPost = async (post)=>{
	// 	if (post.text.startsWith("!kick ")) {
	// 		if (post.author.username !== "moderator") {
	// 			post.chat("You need permission to do that");
	// 			return;
	// 		}
	// 		const username = post.text.substring(6)
	// 		const user = await client.getUserFromUsername(username);
	// 		await group.members[user.id].kick();
	// 		post.chat(`Kicked ${username}`);
	// 	}
	// }
}

module.exports = {client}