const WebSocket = require('ws');
export default class SimpleSocket {
	constructor(init) {
	  this.id = init.project_id;
	  this.token = init.project_token;
  
	  this.socketURL = "wss://https://phosocket.exotek.co/:32560/socket/v2";
	  this.supportsETF = init.useBinary || typeof(TextEncoder) != 'undefined';
	  this.operations = {};
	  this.totalMessages = 0;
  
	  this.remotes = {};
  
	  this.connectSocket();
	}
  
	debug(message, force, error) {
	  if (this.showDebug == true || force) {
		if (this.debugStyle == true) {
		  if (error == true) {
			console.error("%cSimpleSocket%c " + message, "color: #4F61FF; font-family: Didot, sans-serif; font-weight: 900; font-size: 14px;", "color: white");
		  } else {
			console.log("%cSimpleSocket%c " + message, "color: #4F61FF; font-family: Didot, sans-serif; font-weight: 900; font-size: 14px;", "color: white");
		  }
		} else {
		  if (error == true) {
			console.error(message);
		  } else {
			console.log(message);
		  }
		}
	  }
	}
  
	send(oper, data, callback, useID) {
	  let messID = useID;
	  if (useID == null) {
		this.totalMessages += 1;
		messID = parseInt(oper.toString() + this.totalMessages.toString());
	  }
	  let sendData = [messID];
  
	  for (let i = 0; i < data.length; i++) {
		sendData[i+1] = data[i];
	  }
  
	  if (oper > 1) {
		let storeOp = [oper, data, callback];
		if (oper == 2) {
		  storeOp[3] = this.hash(data[0]);
		}
		this.operations[messID] = storeOp;
	  }
  
	  if (this.socket != null && this.socket.readyState == 1 && (this.clientID != null || oper == 1)) {
		let sendStr = JSON.stringify(sendData);
		sendStr = sendStr.substring(1, sendStr.length - 1);
		this.debug("SENT: " + sendStr);
		
		if (this.supportsETF == true) {
		  sendStr = new TextEncoder("utf-8").encode(sendStr);
		}
		
		this.socket.send(sendStr);
  
		if (callback == null && this.operations[messID] != null && oper < 7) {
		  delete this.operations[messID];
		}
	  }
  
	  return messID;
	}
  
	handleMessage(recData) {
	  if (typeof recData === 'object') {
		recData = new TextDecoder("utf-8").decode(recData);
	  }
  
	  this.debug("RECIEVED: " + recData);
  
	  let data = JSON.parse("[" + recData + "]");
  
	  switch (data[0]) {
		case 2:
		  // SUBSCRIBE
		  if (data[4] == null) {
			let opKeys = Object.keys(this.operations);
			for (let i = 0; i < opKeys.length; i++) {
			  let oper = this.operations[opKeys[i]];
			  if (oper[3] == data[1]) {
				if (oper[2] != null) {
				  oper[2](data[2], data[3]);
				}
			  }
			}
		  } else if (this.remotes[data[4]] != null) {
			this.remotes[data[4]](data[2], data[3]);
		  }
		  break;
		case 1:
		  // CONNECT
		  this.debug("CONNECTED: ClientID: " + data[1]);
		  this.clientID = data[1];
		  this.serverID = data[2];
		  this.secureID = data[1] + "-" + data[3];
		  if (this.onopen != null) {
			this.onopen();
		  }
		  // Reconnect Previous Events
		  let opKeys = Object.keys(this.operations);
		  for (let i = 0; i < opKeys.length; i++) {
			let operation = {...this.operations[opKeys[i]]};
			delete this.operations[opKeys[i]];
			this.send(operation[0], operation[1], operation[2], parseInt(opKeys[i]));
		  }
		  break;
		case 0:
		  // ERROR
		  this.debug(data[2], true, true);
		  if (this.operations[data[1]] != null) {
			delete this.operations[data[1]];
		  }
		  if (data[3] == true) {
			this.expectClose = true;
		  } else if (this.operations[data[3]] != null) {
			this.operations[data[3]][3] = this.hash(data[4]);
			this.operations[data[3]][1][0] = data[4];
		  }
	  }
	}
  
	connectSocket() {
	  let intervalConnect = () => {
		this.debug("CONNECTING");
  
		let ending = "";
		if (this.supportsETF == true) {
		  ending = "?en=etf";
		}
		if (this.socket != null) {
		  this.socket.close();
		}
		this.socket = new WebSocket(this.socketURL + ending); // + "&comp=t"
		if (this.supportsETF == true) {
		  this.socket.binaryType = "arraybuffer";
		}
		this.socket.onopen = () => {
		  this.socket.onmessage = (message) => {
			this.handleMessage(message.data);
			if (this.intervalTryConnect != null) {
			  clearInterval(this.intervalTryConnect);
			  this.intervalTryConnect = null;
			}
		  }
		  this.socket.onclose = () => {
			this.closed();
			if (this.expectClose != true) {
			  this.connectSocket();
			}
		  }
		  this.send(1, [this.id, this.token]);
		}
	  }
	  clearInterval(this.intervalTryConnect);
	  this.intervalTryConnect = setInterval(intervalConnect, 10000);
	  intervalConnect();
	}
  
	closed() {
	  this.debug("CONNECTION LOST");
	  this.clientID = null;
	  this.serverID = null;
	  this.secureID = null;
	  if (this.onclose != null) {
		this.onclose();
	  }
	}
  
	hash(text) {
	  if (typeof text === "object") {
		text = JSON.stringify(text);
	  }
	  let hash = 0;
	  for (let i = 0; i < text.length; i++) {
		let char = text.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	  }
	  return hash;
	}
  
	setDefaultConfig(newSet) {
	  this.debug("NEW CONFIG: Config: " + JSON.stringify(newSet));
	  if (this.defaultConfig != null && this.operations[this.defaultConfig] != null) {
		delete this.operations[this.defaultConfig];
	  }
	  this.defaultConfig = this.send(7, [newSet]);
	}
  
	setDisconnectEvent(filter, data, config) {
	  this.debug("Setting Disconnect Event: Filter: " + JSON.stringify(filter) + " | Data: " + JSON.stringify(data) + " | Config: " + JSON.stringify(config));
	  let sendData = [filter, data];
	  if (config != null) {
		sendData[2] = config;
	  }
	  if (this.disconnectEvent != null && this.operations[this.disconnectEvent] != null) {
		delete this.operations[this.disconnectEvent];
		this.disconnectEvent = null;
	  }
	  if (filter != null) {
		this.disconnectEvent = this.send(8, sendData);
	  } else {
		delete this.operations[this.send(8, [null])];
	  }
	}
  
	subscribe(filter, callback, config) {
	  this.debug("SUBSCRIBING: Filter: " + JSON.stringify(filter));
	  let sendData = [filter];
	  if (config != null) {
		sendData[1] = config;
	  }
	  if (callback.length < 2) {
		if (config == null) {
		  sendData[1] = true;
		} else {
		  sendData[2] = true;
		}
	  }
	  let subID = this.send(2, sendData, callback);
	  return {
		id: subID,
		edit: (newFilter) => {
		  if (this.operations[subID] != null) {
			this.debug("EDITING: Filter: " + JSON.stringify(newFilter));
			this.operations[subID][1][0] = newFilter;
			this.send(4, [subID, this.operations[subID][3], newFilter]);
			this.operations[subID][3] = this.hash(newFilter);
		  }
		},
		close: () => {
		  if (this.operations[subID] != null) {
			this.debug("CLOSING " + subID);
			this.send(5, [this.operations[subID][3]]);
			delete this.operations[subID];
		  }
		}
	  }
	}
  
	publish(filter, data, config) {
	  this.debug("PUBLISHING: Filter: " + JSON.stringify(filter) + " | Data: " + JSON.stringify(data));
	  let sendData = [filter, data];
	  if (config != null) {
		sendData[2] = config;
	  }
	  this.send(3, sendData);
	}
  
	remote(secureID) {
	  let splitID = secureID.split("-");
	  this.debug("REMOTING: ClientID: " + splitID[0]);
	  return {
		clientID: splitID[0],
		secureID: splitID[1],
		subscribe: (funcName, filter, config) => {
		  this.debug("REMOTLY SUBSCRIBING: Name: " + funcName);
		  let sendData = [secureID, 2, funcName, filter];
		  if (config != null) {
			sendData[4] = config;
		  }
		  this.send(6, sendData);
		},
		closeSubscribe: (funcName) => {
		  this.debug("REMOTLY UNSUBSCRIBING: Name: " + funcName);
		  this.send(6, [secureID, 5, funcName]);
		}
	  }
	}
  }
