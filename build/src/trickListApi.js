"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrickList = getTrickList;
exports.postTrick = postTrick;
exports.deleteTrick = deleteTrick;
const errors_1 = require("./errors");
const userAuth_1 = require("./userAuth");
const trick_1 = require("./tricks/trick");
async function getTrickList(req, res, db) {
    const userId = req.query.userId;
    return await new Promise((resolve, reject) => {
        let query = 'SELECT Tricks.Id, Tricks.Name, Tricks.Points,\
		Tricks.Date, Spots.Type FROM Tricks INNER JOIN Spots\
		ON Tricks.Id = Spots.TrickId AND Tricks.UserId=?';
        db.query([query, userId], (err, trickList) => {
            if (err)
                reject({
                    type: errors_1.ErrType.MySqlFailedQuery,
                    message: err.code ?? "TODO!"
                });
            let idTricks = [];
            for (let i = 0; i < trickList.length; i++) {
                let idx = idTricks.findIndex(t => t.id == trickList[i].Id);
                if (idx >= 0) {
                    idTricks[idx].trick.spots.push(trickList[i].Type);
                }
                else {
                    idTricks.push({
                        id: trickList[i].Id,
                        trick: {
                            name: trickList[i].Name,
                            spots: [trickList[i].Type],
                            date: trickList[i].Date,
                            points: trickList[i].Points
                        }
                    });
                }
            }
            resolve(() => {
                res.json(idTricks);
            });
        });
    });
}
async function postTrick(req, res, db, secret) {
    return (0, userAuth_1.verifyJwt)(req, res, secret, (userId) => {
        postTrickHelper(req, res, db, userId);
    });
}
async function postTrickHelper(req, res, db, userId) {
    let parts = req.body.parts;
    let spots = req.body.spots;
    let date = req.body.date;
    let description = new trick_1.TrickDescription(parts, spots, date);
    let trick = new trick_1.Trick(description);
    return await new Promise((resolve, reject) => {
        let query = 'INSERT INTO Tricks(UserId,\
		Name, Points, Date) VALUES (?, ?, ?, ?)';
        db.query([query, userId, trick.getName(), trick.getPoints(), date], (err, results) => {
            if (err)
                reject({
                    type: errors_1.ErrType.MySqlFailedQuery,
                    message: err.stack ?? "TODO!"
                });
            let trickId = results.insertId;
            for (const spot of trick.spots) {
                let query = 'INSERT INTO Spots(TrickId, Type)\
				VALUES (?, ?)';
                db.query([query, trickId, spot], (err, _) => {
                    if (err)
                        reject({
                            type: errors_1.ErrType.MySqlFailedQuery,
                            message: err.stack ?? "TODO!"
                        });
                });
            }
            resolve(() => {
                res.status(200).send("Trick added to the list");
            });
        });
    });
}
async function deleteTrick(req, res, db, secret) {
    return (0, userAuth_1.verifyJwt)(req, res, secret, (userId) => {
        deleteTrickHelper(req, res, db, userId);
    });
}
async function deleteTrickHelper(req, res, db, userId) {
    let trickId = req.query.trickId;
    return await new Promise((resolve, reject) => {
        let query = 'DELETE FROM Tricks WHERE\
		Tricks.Id=? AND Tricks.UserId=?';
        db.query([query, trickId, userId], (err, results) => {
            if (err)
                reject({
                    type: errors_1.ErrType.MySqlFailedQuery,
                    message: err.stack ?? "TODO!"
                });
            let query = 'DELETE FROM Spots WHERE\
			Spots.TrickId=?';
            db.query([query, trickId], (err, _) => {
                if (err)
                    reject({
                        type: errors_1.ErrType.MySqlFailedQuery,
                        message: err.stack ?? "TODO!"
                    });
            });
            resolve(() => {
                res.status(200).send("Trick deleted from the trick list");
            });
        });
    });
}
//# sourceMappingURL=trickListApi.js.map