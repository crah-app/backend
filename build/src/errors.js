"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrType = void 0;
var ErrType;
(function (ErrType) {
    ErrType[ErrType["MySqlConnectionFailed"] = 500] = "MySqlConnectionFailed";
    ErrType[ErrType["MySqlFailedQuery"] = 500] = "MySqlFailedQuery";
    ErrType[ErrType["JwtTokenNotFound"] = 400] = "JwtTokenNotFound";
    ErrType[ErrType["JwtTokenMissingIat"] = 401] = "JwtTokenMissingIat";
    ErrType[ErrType["JwtTokenMissingSub"] = 401] = "JwtTokenMissingSub";
    ErrType[ErrType["JwtTokenExpired"] = 401] = "JwtTokenExpired";
})(ErrType || (exports.ErrType = ErrType = {}));
//# sourceMappingURL=errors.js.map