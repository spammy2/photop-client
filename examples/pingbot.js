const { Chat, Client, Post } = require("..");
require("dotenv").config();

const client = new Client(
	{ username: process.env.USERNAME, password: process.env.PASSWORD },
	{ logSocketMessages: true }
);

client.groups

client.onPost = (post)=>{
	post.chat("Testing 1.2.3");
	post.connect();
	post.onChat = ()=>{
		console.log("chat received")
	}
}
