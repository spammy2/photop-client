const { Chat, Client, Post } = require("..");
require("dotenv").config();

const client = new Client(
	{ username: process.env.USERNAME, password: process.env.PASSWORD },
	{ logSocketMessages: true }
);

client.onPost = (post)=>{
	post.connect(1000, ()=>{
		post.chat("disconnect")
	})
}
