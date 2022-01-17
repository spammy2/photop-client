const { Chat, Client, Post } = require("..");
require("dotenv").config();

const client = new Client(
	{ username: process.env.USERNAME, password: process.env.PASSWORD },
	{ logSocketMessages: true }
);

client.onReady=async ()=>{
	//this guy is following way too many people
	const user = await client.getUserFromUsername("Some_Random_Guy")
	await user.loadFollowingUsers();

	for (const following of user.following) {
		await following.follow();
		await new Promise((res)=>{setTimeout(res, 2000)})
		console.log("followed", following.username)
	}
}
