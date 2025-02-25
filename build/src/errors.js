"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrType = void 0;
var ErrType;
(function (ErrType) {
    ErrType[ErrType["MySqlConnectionFailed"] = 500] = "MySqlConnectionFailed";
    ErrType[ErrType["MySqlFailedQuery"] = 404] = "MySqlFailedQuery";
    ErrType[ErrType["JwtTokenNotFound"] = 300] = "JwtTokenNotFound";
    ErrType[ErrType["JwtTokenMissingIat"] = 200] = "JwtTokenMissingIat";
    ErrType[ErrType["JwtTokenMissingSub"] = 100] = "JwtTokenMissingSub";
    ErrType[ErrType["JwtTokenExpired"] = 150] = "JwtTokenExpired";
})(ErrType || (exports.ErrType = ErrType = {}));
//# sourceMappingURL=errors.js.map