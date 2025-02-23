"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
class App {
    inner;
    constructor() {
        let app = (0, express_1.default)();
        app.use((0, cors_1.default)());
        app.use(express_1.default.json());
        app.use("/assets", express_1.default.static('assets'));
        this.inner = app;
    }
    listen(port) {
        this.inner.listen(port, () => {
            console.log("Server listening at port: " + port);
        });
    }
}
exports.App = App;
//# sourceMappingURL=app.js.map