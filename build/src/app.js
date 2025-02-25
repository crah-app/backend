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
    async get(path, fn) {
        this.inner.get(path, async (req, res) => {
            let r = await fn(req, res);
            if ("type" in r) {
                console.error(r);
                res.status(r.type).send(r.message);
            }
            else {
                r(req, res);
            }
        });
    }
    async post(path, fn) {
        this.inner.post(path, async (req, res) => {
            let r = await fn(req, res);
            if ("type" in r) {
                console.error(r);
                res.status(r.type).send(r.message);
            }
            else {
                r(req, res);
            }
        });
    }
    async delete(path, fn) {
        this.inner.delete(path, async (req, res) => {
            let r = await fn(req, res);
            if ("type" in r) {
                console.error(r);
                res.status(r.type).send(r.message);
            }
            else {
                r(req, res);
            }
        });
    }
    listen(port) {
        this.inner.listen(port, () => {
            console.log("Server listening at port: " + port);
        });
    }
}
exports.App = App;
//# sourceMappingURL=app.js.map