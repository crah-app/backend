"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrickListByUserId = getTrickListByUserId;
exports.postTrickToTrickList = postTrickToTrickList;
const errors_1 = require("./errors");
const userAuth_1 = require("./userAuth");
const trick_1 = require("./tricks/trick");
async function getTrickListByUserId(req, res, db) {
    const userId = req.query.id;
    try {
        const results = await new Promise((resolve, reject) => {
            db.query('SELECT Tricks.Id, Tricks.Name, Tricks.Points, Tricks.Date, Spots.Type FROM Tricks INNER JOIN Spots ON Tricks.Id = Spots.TrickId AND Tricks.UserId=' + userId, (err, results) => {
                if (err) {
                    reject({ type: errors_1.ErrType.MySqlFailedQuery, message: err.code ?? undefined });
                }
                else {
                    let fetchedTricks = [];
                    for (let i = 0; i < results.length; i++) {
                        let idx = fetchedTricks.findIndex(t => t.id == results[i].Id);
                        if (idx >= 0) {
                            fetchedTricks[idx].trick.spots.push(results[i].Type);
                        }
                        else {
                            fetchedTricks.push({
                                id: results[i].Id,
                                trick: {
                                    name: results[i].Name,
                                    spots: [results[i].Type],
                                    date: results[i].Date,
                                    points: results[i].Points
                                }
                            });
                        }
                    }
                    res.json(fetchedTricks);
                    resolve(undefined);
                }
            });
        });
    }
    catch (err) {
        return err;
    }
}
async function postTrickToTrickList(req, res, db, secret) {
    const userId = req.query.id;
    return (0, userAuth_1.verifyJwt)(req, res, secret, () => {
        addTrickToTrickList(req, res, db);
    });
}
async function addTrickToTrickList(req, res, db) {
    const userId = req.query.id;
    let desc = new trick_1.TrickDescription(req.body.parts, req.body.spots, req.body.date);
    let trick = new trick_1.Trick(desc);
    try {
        const results = await new Promise((resolve, reject) => {
            db.query('INSERT INTO Tricks(UserId, Name, Points, Date) VALUES (' + userId + ',\"' + trick.getName() + '\",' + trick.getPoints() + ',' + trick.date + ')', (err, results) => {
                if (err) {
                    reject({ type: errors_1.ErrType.MySqlFailedQuery, message: err.code ?? undefined });
                }
                else {
                    let trickId = results.insertId;
                    for (const spot of trick.spots) {
                        db.query('INSERT INTO Spots(TrickId, Type) VALUES (' + trickId + ',' + spot + ')', (err, results) => {
                            if (err) {
                                reject({ type: errors_1.ErrType.MySqlFailedQuery, message: err.code ?? undefined });
                            }
                        });
                    }
                    res.status(200).send("Trick added to the list");
                    resolve(undefined);
                }
            });
        });
        return results;
    }
    catch (err) {
        return err;
    }
}
//# sourceMappingURL=trickListApi.js.map