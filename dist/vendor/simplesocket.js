const {WebSocket} = require("ws");

// SimpleSocket Client Library
// ©2022 Exotek
let SimpleSocket = { remoteFunctions: {} },
	SimpleSocketAPI = {
		SocketURL: "wss://simplesocket.net:32560/simplesocket/socket",
	};
(SimpleSocketAPI.SupportsETF = "undefined" != typeof TextEncoder),
	(SimpleSocketAPI.Operations = {}),
	(SimpleSocketAPI.TotalMessages = 0),
	(SimpleSocketAPI.ConnectSocket = function () {
		let e = "";
		1 == SimpleSocketAPI.SupportsETF && (e = "?en=etf"),
			(SimpleSocketAPI.Socket = new WebSocket(
				SimpleSocketAPI.SocketURL + e
			)),
			1 == SimpleSocketAPI.SupportsETF &&
				(SimpleSocketAPI.Socket.binaryType = "arraybuffer");
	}),
	(SimpleSocketAPI.Debug = function (e, t, o) {
		(1 == SimpleSocket.debug || t) &&
			(1 == SimpleSocket.debugStyle
				? 1 == o
					? console.error(
							"%cSimpleSocket%c " + e,
							"color: #4F61FF; font-family: Didot, sans-serif; font-weight: 900; font-size: 14px;",
							"color: white"
					  )
					: console.log(
							"%cSimpleSocket%c " + e,
							"color: #4F61FF; font-family: Didot, sans-serif; font-weight: 900; font-size: 14px;",
							"color: white"
					  )
				: 1 == o
				? console.error(e)
				: console.log(e));
	}),
	(SimpleSocketAPI.TryConnection = async function () {
		return await new Promise(async function (e, t) {
			function o() {
				SimpleSocketAPI.Debug("CONNECTING"),
					SimpleSocketAPI.ConnectSocket(),
					(SimpleSocketAPI.Socket.onopen = function (t) {
						(SimpleSocketAPI.Socket.onmessage = function (t) {
							SimpleSocketAPI.Message(t.data),
								null != SimpleSocketAPI.IntervalConnection &&
									(clearInterval(
										SimpleSocketAPI.IntervalConnection
									),
									(SimpleSocketAPI.IntervalConnection = null),
									SimpleSocketAPI.Open(t.data),
									e(!0));
						}),
							(SimpleSocketAPI.Socket.onclose = function () {
								SimpleSocketAPI.Close(),
									1 != SimpleSocketAPI.ExpectClose &&
										SimpleSocketAPI.TryConnection();
							}),
							SimpleSocketAPI.SendData("Connect", {
								Type: "Client",
								ID: SimpleSocketAPI.ID,
								Token: SimpleSocketAPI.Token,
							});
					});
			}
			clearInterval(SimpleSocketAPI.IntervalConnection),
				(SimpleSocketAPI.IntervalConnection = setInterval(o, 1e4)),
				o();
		});
	}),
	(SimpleSocketAPI.SendData = function (e, t, o, n) {
		if (
			((SimpleSocketAPI.TotalMessages += 1),
			SimpleSocketAPI.TotalMessages > 9999 &&
				(SimpleSocketAPI.TotalMessages = 0),
			null == t.O &&
				(t.O =
					e + "_" + Date.now() + "_" + SimpleSocketAPI.TotalMessages),
			"Connect" != e && (1 != n || null != o))
		) {
			let n = { OP: t.O, Task: e, Data: t };
			if ("Subscribe" == e && null != t.Ftr) {
				let e = t.Ftr;
				"object" == typeof t.Ftr && (e = JSON.stringify(e)),
					null != t.Con && (e += JSON.stringify(t.Con)),
					(n.Hash = SimpleSocketAPI.Hash(e));
			}
			null != o && (n.Callback = o),
				(SimpleSocketAPI.Operations[t.O] = n);
		}
		let S = JSON.stringify(t);
		return (
			null == SimpleSocketAPI.Socket ||
				1 != SimpleSocketAPI.Socket.readyState ||
				(null == SimpleSocket.ClientID && "Connect" != e) ||
				(SimpleSocketAPI.Debug("DATA SENT: " + S),
				1 == SimpleSocketAPI.SupportsETF &&
					(S = new TextEncoder("utf-8").encode(S)),
				SimpleSocketAPI.Socket.send(S),
				null == o &&
					null != SimpleSocketAPI.Operations[t.O] &&
					delete SimpleSocketAPI.Operations[t.O]),
			t.O
		);
	}),
	(SimpleSocketAPI.Open = function (e) {
		SimpleSocketAPI.Debug("CONNECTED"),
			"object" == typeof e && (e = new TextDecoder("utf-8").decode(e));
		let t = JSON.parse(e);
		(SimpleSocket.ClientID = t.ClientID),
			(SimpleSocket.ServerID = t.ServerID),
			null != SimpleSocket.onopen && SimpleSocket.onopen(),
			null != SimpleSocket.onfirstopen && SimpleSocket.onfirstopen(),
			null != SimpleSocketAPI.DefaultConfig &&
				SimpleSocketAPI.SendData(
					"DefaultConfig",
					SimpleSocketAPI.DefaultConfig
				),
			null != SimpleSocketAPI.DisconnectEvent &&
				SimpleSocketAPI.SendData(
					"DisPub",
					SimpleSocketAPI.DisconnectEvent
				);
		let o = Object.keys(SimpleSocketAPI.Operations);
		for (let e = 0; e < o.length; e++) {
			let t = { ...SimpleSocketAPI.Operations[o[e]] };
			null != t.Data
				? (delete SimpleSocketAPI.Operations[o[e]],
				  SimpleSocketAPI.SendData(t.Task, t.Data, t.Callback, !0))
				: delete SimpleSocketAPI.Operations[o[e]];
		}
	}),
	(SimpleSocketAPI.RemoveSub = function (e) {
		null != SimpleSocketAPI.Operations[e] &&
			delete SimpleSocketAPI.Operations[e];
	}),
	(SimpleSocketAPI.Message = function (e) {
		"object" == typeof e && (e = new TextDecoder("utf-8").decode(e));
		let t = JSON.parse(e),
			o = "";
		if (null != t.O) {
			let e = SimpleSocketAPI.Operations[t.O];
			if (null != e) {
				let n = Date.now() - e[0];
				(o = " | TOOK: " + n + " MS"),
					(SimpleSocket.socketLatancy = n),
					null != e[2] && e[2](t.D),
					delete e;
			}
		}
		null != t.CF && SimpleSocket[t.CF](t.P),
			1 == t.Close && (SimpleSocketAPI.ExpectClose = !0),
			SimpleSocketAPI.Debug("DATA RECIEVED: " + e + o),
			null != t.E &&
				(SimpleSocketAPI.RemoveSub(t.O),
				SimpleSocketAPI.Debug("ERROR: " + t.E, !0, !0));
	}),
	(SimpleSocketAPI.Close = function () {
		SimpleSocketAPI.Debug("CONNECTION LOST"),
			(SimpleSocket.ClientID = null),
			(SimpleSocket.ServerID = null),
			null != SimpleSocket.onclose && SimpleSocket.onclose();
	}),
	(SimpleSocketAPI.Hash = function (e) {
		let t = 0;
		for (let o = 0; o < e.length; o++) {
			(t = (t << 5) - t + e.charCodeAt(o)), (t &= t);
		}
		return t;
	}),
	(SimpleSocket.socketLatancy = 0),
	(SimpleSocket.CLIENT_ID = "ClientID_REPLACE_ake83awi25"),
	(SimpleSocket.connect = async function (e) {
		(SimpleSocketAPI.IsConnecting = !0),
			(SimpleSocketAPI.ID = e.project_id),
			(SimpleSocketAPI.Token = e.client_token),
			await SimpleSocketAPI.TryConnection();
	}),
	(SimpleSocketAPI.DefaultConfig = null),
	(SimpleSocket.setDefaultConfig = function (e) {
		if (null == SimpleSocketAPI.IsConnecting)
			return void SimpleSocketAPI.Debug(
				"ERROR: Must connect WebSocket first, call SimpleSocket.connect({ project_id, client_token });",
				!0,
				!0
			);
		SimpleSocketAPI.Debug("NEW CONFIG: Config: " + JSON.stringify(e));
		let t = { Default: e };
		SimpleSocketAPI.SendData("DefaultConfig", t),
			(SimpleSocketAPI.DefaultConfig = t);
	}),
	(SimpleSocket.publishEvent = function (e, t, o) {
		if (null == SimpleSocketAPI.IsConnecting)
			return void SimpleSocketAPI.Debug(
				"ERROR: Must connect WebSocket first, call SimpleSocket.connect({ project_id, client_token });",
				!0,
				!0
			);
		SimpleSocketAPI.Debug(
			"PUBLISHING: Filter: " +
				JSON.stringify(e) +
				" | Data: " +
				JSON.stringify(t) +
				" | Config: " +
				JSON.stringify(o)
		);
		let n = { Ftr: e, Data: t };
		null != o && (n.Con = o), SimpleSocketAPI.SendData("Publish", n);
	}),
	(SimpleSocket.subscribeEvent = function (e, t, o) {
		if (null == SimpleSocketAPI.IsConnecting)
			return void SimpleSocketAPI.Debug(
				"ERROR: Must connect WebSocket first, call SimpleSocket.connect({ project_id, client_token });",
				!0,
				!0
			);
		SimpleSocketAPI.Debug(
			"SUBSCRIBING: Filter: " +
				JSON.stringify(e) +
				" | Config: " +
				JSON.stringify(o)
		);
		let n = { Ftr: e };
		return (
			null != o && (n.Con = o),
			t.length < 2 && (null == o && (n.Con = {}), (n.Con.NoConfig = !0)),
			"FUNCTION_SubEvent:" + SimpleSocketAPI.SendData("Subscribe", n, t)
		);
	}),
	(SimpleSocket.Broadcast = function (e) {
		if (null == e.Func) {
			let t = Object.keys(SimpleSocketAPI.Operations);
			for (let o = 0; o < t.length; o++) {
				let n = SimpleSocketAPI.Operations[t[o]];
				n.Hash == e.Hash &&
					null != n.Callback &&
					n.Callback(e.Data, e.Config);
			}
		} else
			null != SimpleSocket.remoteFunctions[e.Func] &&
				SimpleSocket.remoteFunctions[e.Func](e.Data, e.Config);
	}),
	(SimpleSocket.RemoteControl = function (e) {
		if ("Sub" == e.T) {
			let t = { Ftr: e.Ftr, Con: e.Con },
				o = e.Ftr;
			"object" == typeof e.Ftr && (o = JSON.stringify(o)),
				null != e.Con && (o += JSON.stringify(e.Con)),
				(t.Hash = SimpleSocketAPI.Hash(o)),
				(t.Func = e.Func),
				(SimpleSocketAPI.Operations["Subscribe_" + e.Func + "_Remote"] =
					t),
				SimpleSocketAPI.Debug(
					"[REMOTE] SUBSCRIBING: Filter: " + JSON.stringify(e.Ftr)
				);
		} else
			"CloseSub" == e.T &&
				null !=
					SimpleSocketAPI.Operations[
						"Subscribe_" + e.Func + "_Remote"
					] &&
				(delete SimpleSocketAPI.Operations[
					"Subscribe_" + e.Func + "_Remote"
				],
				SimpleSocketAPI.Debug(
					"[REMOTE] CLOSING SUB: Function: " + e.Func
				));
	}),
	(SimpleSocket.editSubscribe = function (e, t, o) {
		if (null == SimpleSocketAPI.IsConnecting)
			return void SimpleSocketAPI.Debug(
				"ERROR: Must connect WebSocket first, call SimpleSocket.connect({ project_id, client_token });",
				!0,
				!0
			);
		let n = {};
		if (
			(null != t && (n.Ftr = t),
			null != o && (n.Con = o),
			Object.keys(n) < 1)
		)
			return;
		let S = e.substring(18);
		if (
			null == SimpleSocketAPI.Operations[S] ||
			null != SimpleSocketAPI.Operations[S].Func
		)
			return;
		let l = SimpleSocketAPI.Operations[S].Data,
			i = null,
			c = "";
		(c += null != t ? JSON.stringify(t) : JSON.stringify(l.Ftr)),
			(c += null != o ? JSON.stringify(o) : JSON.stringify(l.Con)),
			(i = SimpleSocketAPI.Hash(c)),
			i != SimpleSocketAPI.Operations[S].Hash &&
				((n.PrevHash = SimpleSocketAPI.Operations[S].Hash),
				null != t &&
					((SimpleSocketAPI.Operations[S].Data.Ftr = t),
					(SimpleSocketAPI.Operations[S].Hash = i)),
				null != o && (SimpleSocketAPI.Operations[S].Data.Con = o),
				SimpleSocketAPI.Debug(
					"EDITING SUB: Function: " +
						e +
						" | New Filter: " +
						JSON.stringify(t) +
						" | New Config: " +
						JSON.stringify(o)
				),
				null != SimpleSocket.ClientID &&
					SimpleSocketAPI.SendData("EditSub", n));
	}),
	(SimpleSocket.closeSubscribe = function (e) {
		if (null == SimpleSocketAPI.IsConnecting)
			return void SimpleSocketAPI.Debug(
				"ERROR: Must connect WebSocket first, call SimpleSocket.connect({ project_id, client_token });",
				!0,
				!0
			);
		let t = e.substring(18);
		null != SimpleSocketAPI.Operations[t] &&
			null == SimpleSocketAPI.Operations[t].Func &&
			(SimpleSocketAPI.Debug("CLOSING SUBSCRIBE: ID: " + e),
			SimpleSocketAPI.SendData("CloseSub", {
				Hash: SimpleSocketAPI.Operations[t].Hash,
			}),
			SimpleSocketAPI.RemoveSub(t));
	}),
	(SimpleSocketAPI.DisconnectEvent = null),
	(SimpleSocket.setDisconnectEvent = function (e, t, o) {
		if (null == SimpleSocketAPI.IsConnecting)
			return void SimpleSocketAPI.Debug(
				"ERROR: Must connect WebSocket first, call SimpleSocket.connect({ project_id, client_token });",
				!0,
				!0
			);
		SimpleSocketAPI.Debug(
			"Setting Disconnect Event: Filter: " +
				JSON.stringify(e) +
				" | Data: " +
				JSON.stringify(t) +
				" | Config: " +
				JSON.stringify(o)
		);
		let n = { Ftr: e, Data: t };
		null != o && (n.Con = o),
			SimpleSocketAPI.SendData("DisPub", n),
			null != e || null == SimpleSocketAPI.DisconnectEvent
				? (SimpleSocketAPI.DisconnectEvent = n)
				: delete SimpleSocketAPI.DisconnectEvent;
	});
module.exports = SimpleSocket;
