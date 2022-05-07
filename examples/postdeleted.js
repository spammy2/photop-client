const { Chat, Client, Post } = require("..");
require("dotenv").config();

const client = new Client(
	{ username: process.env.USERNAME, password: process.env.PASSWORD },
	{ logSocketMessages: true, disableGroups: true }
);

client.onPost = (post)=>{
	post.connect();
	post.onDeleted = ()=>{
		console.log("oh no");
	}
}
