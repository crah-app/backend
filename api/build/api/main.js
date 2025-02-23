"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const trick_1 = require("./tricks/trick");
let dbConn = new DbConnection(process.env.DB_HOST, process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD);
dbConn.connect();
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use(express_1.default.json());
app.use("/assets", express_1.default.static('assets'));
app.get("/api/tricks", (req, res) => {
    const userId = req.query.id;
    db.query('SELECT Tricks.Id, Tricks.Name, Tricks.Points, Tricks.Date, Spots.Type FROM Tricks INNER JOIN Spots ON Tricks.Id = Spots.TrickId AND Tricks.UserId=' + userId, (err, results) => {
        if (err) {
            console.error('Error executing query: ' + err.stack);
            res.status(500).send('Error fetching users');
            return;
        }
        let id_tricks = [];
        for (let i = 0; i < results.length; i++) {
            let idx = id_tricks.findIndex(t => t[0] == results[i].Id);
            if (idx >= 0) {
                id_tricks[idx][1].spots.push(results[i].Type);
            }
            else {
                id_tricks.push([results[i].Id, {
                        name: results[i].Name,
                        spots: [results[i].Type],
                        date: results[i].Date,
                        points: results[i].Points
                    }]);
            }
        }
        res.json(id_tricks.map(e => e[1]));
    });
});
app.post("/api/tricks/new", (req, res) => {
    authJwt(req, res, createTrick);
});
function createTrick(req, res) {
    const userId = req.query.id;
    let desc = new trick_1.TrickDescription(req.body.parts, req.body.spots, req.body.date);
    let trick = new trick_1.Trick(desc);
    db.query('INSERT INTO Tricks(UserId, Name, Points, Date) VALUES (' + userId + ',\"' + trick.getName() + '\",' + trick.getPoints() + ',' + trick.date + ')', (err, results) => {
        if (err) {
            console.error(err.stack);
            res.status(500).send('Error fetching users');
            return;
        }
        else {
            let trickId = results.insertId;
            for (const spot of trick.spots) {
                db.query('INSERT INTO Spots(TrickId, Type) VALUES (' + trickId + ',' + spot + ')', (err, results) => {
                });
            }
        }
    });
    res.status(200).send(" YEEEA TRICK ADDED");
}
app.delete("/api/tricks/delete", (req, res) => {
});
app.listen(PORT, () => {
    console.log("Server listening at port: " + PORT);
});
//# sourceMappingURL=main.js.map