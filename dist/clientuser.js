"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientUser = void 0;
const user_1 = require("./user");
class ClientUser extends user_1.User {
    constructor(network, props) {
        super(network, props);
        this.email = props.email;
    }
    updateRaw(raw) {
        super.updateRaw(raw);
        if (raw.Email) {
            this.email = raw.Email;
        }
    }
    static FromAccountData(network, raw) {
        return new ClientUser(network, Object.assign(Object.assign({}, this.GetUserPropsFromRaw(raw)), { email: raw.Email }));
    }
    static FromSignIn(network, raw) {
        return new ClientUser(network, {
            socials: this.ConvertSocials(raw.ProfileData.Socials),
            email: raw.Email,
            roles: this.NormalizeRoles(raw.Role),
            timestamp: parseInt(raw.UserID.substring(0, 8), 16) * 1000,
            id: raw.UserID,
            username: raw.RealUser,
        });
    }
}
exports.ClientUser = ClientUser;
//# sourceMappingURL=clientuser.js.map