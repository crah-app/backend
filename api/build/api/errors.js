"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrType = void 0;
var ErrType;
(function (ErrType) {
    ErrType[ErrType["MySqlConnectionFailed"] = 0] = "MySqlConnectionFailed";
    ErrType[ErrType["JwtTokenNotFound"] = 1] = "JwtTokenNotFound";
    ErrType[ErrType["JwtTokenMissingIat"] = 2] = "JwtTokenMissingIat";
    ErrType[ErrType["JwtTokenExpired"] = 3] = "JwtTokenExpired";
})(ErrType || (exports.ErrType = ErrType = {}));
//# sourceMappingURL=errors.js.map