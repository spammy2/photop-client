const { Chat, Client, Post } = require("..");
const {writeFileSync} = require("fs"); 
require("dotenv").config();

const client = new Client(
	{ username: process.env.USERNAME, password: process.env.PASSWORD },
	{ logSocketMessages: true }
);

client.onReady=async ()=>{
	const user = await client.getUserFromUsername("Shouta_")
	
	const posts = await user.getPosts(/*Date.now() - 14 * 24 * 60 * 60 * 1000*/);
	const mapped = posts.map(p=>{
		return p.timestamp
	});

	writeFileSync("./out.json", JSON.stringify(mapped));

}
