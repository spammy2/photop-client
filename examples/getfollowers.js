const { Chat, Client, Post } = require("..");
require("dotenv").config();

const client = new Client(
	{ username: process.env.USERNAME, password: process.env.PASSWORD },
	{ logSocketMessages: true }
);

client.onReady=async ()=>{
	//this guy is following way too many people
	const user = await client.getUserFromUsername("Nylon_Kings")

	await user.loadFollowingUsers();

	for (const following of user.following) {
		if (await following.follow()) {
			console.log("followed", following.username)
		};
	}
}
