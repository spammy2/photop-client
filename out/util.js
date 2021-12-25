"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CleanString = void 0;
function CleanString(String) {
    String = String.replace(/\=/g, '&#61;');
    String = String.replace(/\?/g, "&#63;");
    String = String.replace(/\</g, '&#60;');
    String = String.replace(/\>/g, '&#62;');
    return String;
}
exports.CleanString = CleanString;
