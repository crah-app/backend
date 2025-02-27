"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJwt = verifyJwt;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("./errors");
async function verifyJwt(req, res, secret, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token)
        return { type: errors_1.ErrType.JwtTokenNotFound };
    const decoded = jsonwebtoken_1.default.verify(token, secret);
    if (!decoded.iat)
        return { type: errors_1.ErrType.JwtTokenMissingIat };
    req.token = decoded;
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.iat < currentTime)
        return { type: errors_1.ErrType.JwtTokenExpired };
    console.log(decoded.sub);
    if (decoded.sub !== undefined)
        return { type: errors_1.ErrType.JwtTokenMissingSub };
    return next(req, res, decoded.sub);
}
//# sourceMappingURL=userAuth.js.map