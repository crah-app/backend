"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrType = void 0;
var ErrType;
(function (ErrType) {
    ErrType[ErrType["MySqlConnectionFailed"] = 500] = "MySqlConnectionFailed";
    ErrType[ErrType["MySqlFailedQuery"] = 404] = "MySqlFailedQuery";
    ErrType[ErrType["JwtTokenNotFound"] = 300] = "JwtTokenNotFound";
    ErrType[ErrType["JwtTokenMissingIat"] = 300] = "JwtTokenMissingIat";
    ErrType[ErrType["JwtTokenExpired"] = 300] = "JwtTokenExpired";
})(ErrType || (exports.ErrType = ErrType = {}));
//# sourceMappingURL=errors.js.map