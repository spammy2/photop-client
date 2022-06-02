const { Chat, Client, Post } = require("..");
const {writeFileSync} = require("fs"); 
require("dotenv").config();

const client = new Client(
	{ username: process.env.USERNAME, password: process.env.PASSWORD },
	{ logSocketMessages: true }
);

client.onReady=async ()=>{
	const desc = Math.floor(Math.random() * 1000000);
	await client.editor().setDescription(desc.toString()).save();
	console.log("description set to: " + desc);
}
