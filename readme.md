# Photop Client
Photop Client is a library for creating bots for Photop. It works directly with the WebSocket instead of html to deliver minimal memory impact and ease of use.

## How to get started
Install node and create a project.
Open terminal and change your directory to your project.
Install photop-client like this `npm i photop-client@latest`
In your node.js program, put `const {Client} = require("photop-client")`

Photop Client has heavy influence from discord.js. Creating posts and listening for posts start with the Client.

You can instantiate the Photop Client in 3 ways.
1. With username and password.
2. With authorization token, userid, fingerprint. (You can find it in dev console)
3. With nothing (this means you cannot interact with Photop like liking posts but you can see messages)

Using token is suggested because there is an extra step with the username and password.

```js
const { Client } = require("photop-client")

const clientWithUsername = new Client({username: "PhotopClient", password:"123456"})

const clientWithToken = new Client({token: "1234abcdef56789", userid: "abc123def", fingerprint: "1011121314151617"})

const guestClient = new Client();
```

### Create a post
```js
const post = client.post("Hey you people");
```
> Photop Client does not support images at the moment.


### Replies to posts that contains "bot"
```js
client.onPost = (post)=>{
	if (post.text.match(/bot/)) {
		post.chat("Bottttt")
	}
}
```

### Listen for chat messages in a post
```js
// this would be put inside client.onPost

post.connect();
post.onChat = (chat)=>{
	if (chat.text.match(/bot/)) {
		post.chat("Bot")
		// you can also access post with chat.post
		// chat.reply("Bot") If you want to reply instead of sending a message.
	}
}
```

You can take a look in `github.com/spammy2/sockbot` to see how to create a discord-ish bot.


## Contributing
Photop-Client is not complete! There are many features which are not implemented. Documentation is also not fully done. Robot_Engine plans to rely on SimpleSocket instead of normal WebSockets so updates will be necessary in the future. You can make your own contributions to Photop-Client. Note that it is written in typescript, so you may need to learn it.
### Architecture
Photop-Client abstractifies the client, users, chats, and posts into classes, defined in their respective files.
A private network class handles everything pertaining to the network and all classes perform their actions by calling methods of it.
The network class is has no 'dependencies' and contains no reference to the client. By doing this, a Post or Chat is separate from the Client.