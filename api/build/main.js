"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const dbConnection_1 = require("./dbConnection");
const app_1 = require("./app");
const trickListApi_1 = require("./trickListApi");
dotenv_1.default.config();
let dbConn = new dbConnection_1.DbConnection(process.env.DB_HOST, process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD);
dbConn.connect();
let app = new app_1.App();
app.get("/api/tricks", (req, res) => {
    return (0, trickListApi_1.getTrickListByUserId)(req, res, dbConn);
});
app.post("/api/tricks/new", (req, res) => {
    return (0, trickListApi_1.postTrickToTrickList)(req, res, dbConn, process.env.CLERK_PEM_PUBLIC_KEY);
});
app.listen(process.env.PORT);
//# sourceMappingURL=main.js.map