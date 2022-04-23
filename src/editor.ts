import { Network } from "./network";



class EditorError extends Error {
	name = "EditorError";
	constructor(message: string) {
		super(message);
	}
}

type Change =
	| {
			Change: "ProfileDescription";
			NewText: string;
	  }
	| {};
const VerifyEmailRegex =
	/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const VerifyUsernameRegex = /[A-Za-z0-9_-]{3,16}/;

interface ModifiedUserData {
	username?: string;
	password?: { OldPassword: string; NewPassword: string };
	email?: string;
}

/**
 * Interface for batching edits together; NOT DONE
 */
export class Editor {
	_modified: ModifiedUserData = {};
	setEmail(email: string) {
		if (VerifyEmailRegex.test(email)) {
			return this;
		} else {
			throw new TypeError("Invalid email");
		}
	}

	setUsername(username: string) {
		if (VerifyUsernameRegex.test(username)) {
			this._modified.username = username;
			return this;
		} else {
			throw new TypeError("Invalid username");
		}
	}

	setPassword(oldpassword: string, password: string) {
		if (password.length < 8) throw new TypeError("Password is too short");
		if (/\d/.test(password)) throw new TypeError("Password does not contain a number");
		if (/[ !@#$%^&*()+\-_=\[\]{};':"\\|,.<>\/?]/.test(password))
			throw new TypeError("Password does not contain a special character");
		this._modified.password = {
			OldPassword: oldpassword,
			NewPassword: password,
		};
		return this;
	}

	async save() {
		const updates: Change[] = [];
		if (this._modified.username) {
			updates.push({ Change: "Username", NewText: this._modified.username });
		} else if (this._modified.password) {
			updates.push({ Change: "Password", ...this._modified.password });
		} else if (this._modified.email) {
			updates.push({ Change: "Email", Email: this._modified.email });
		}
		const result = await this._network.message("UpdateAccountData", { Update: [] });
		switch (result.Body.Code) {
			case 200:
				return true;
			case 400:
				throw new EditorError("Image file size too large");
			case 403:
				throw new EditorError("Password is incorrect");
		}
	}
	constructor(private _network: Network) {}
}
async (editor: Editor) => {
	try {
		editor.setEmail("yourmom@mommy.com").setUsername("Your_mom").save();
	} catch (e) {
		console.log(e);
	}
};
