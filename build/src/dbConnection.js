"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbConnection = void 0;
const errors_1 = require("./errors");
const mysql_1 = __importDefault(require("mysql"));
class DbConnection {
    inner;
    constructor(host, database, user, password) {
        this.inner = mysql_1.default.createConnection({
            host: host,
            user: user,
            password: password,
            database: database
        });
    }
    connect() {
        this.inner.connect((err) => {
            if (err)
                return { type: errors_1.ErrType.MySqlConnectionFailed, content: err };
            console.log("Connected to MySQL with ID " + this.inner.threadId);
        });
        return;
    }
    query(query, fn) {
        return this.inner.query(query, fn);
    }
}
exports.DbConnection = DbConnection;
//# sourceMappingURL=dbConnection.js.map