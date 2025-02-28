import { Success, Err, ErrType } from './errors.js';
import { Request, Response } from 'express';
import  DbConnection  from './dbConnection.js';
import { verifyJwt } from './userAuth.js';
import { Trick, TrickDescription } from '../trickLogic/trick.js';
import { Spot } from '../trickLogic/spot.js';

export async function getTrickList(req: Request, res: Response, db: DbConnection): Promise<void> {
    try {
        const userId = req.query.userId;
        if (!userId) {
            res.status(400).json({ error: "User ID is required" });
            return;
        }

        // SQL-Abfrage
        const query = `
            SELECT Tricks.Id, Tricks.Name, Tricks.Points, Tricks.Date, Spots.Type
            FROM Tricks
            INNER JOIN Spots ON Tricks.Id = Spots.TrickId
            WHERE Tricks.UserId = ?;
        `;

        // Datenbankabfrage
        const trickList = await new Promise<any>((resolve, reject) => {
            db.query([query,userId], (err, results) => {
                if (err) {
                    reject({
                        type: ErrType.MySqlFailedQuery,
                        message: err.code ?? "Database query failed"
                    });
                }
                resolve(results);
            });
        });

        const idTricks: Map<number, { id: number, trick: { name: string, spots: string[], date: string, points: number } }> = new Map();

        // Gruppieren der Tricks
        trickList.forEach((row: any) => {
            if (idTricks.has(row.Id)) {
                idTricks.get(row.Id)?.trick.spots.push(row.Type);
            } else {
                idTricks.set(row.Id, {
                    id: row.Id,
                    trick: {
                        name: row.Name,
                        spots: [row.Type],
                        date: row.Date,
                        points: row.Points
                    }
                });
            }
        });

        res.json(Array.from(idTricks.values()));
    } catch (error) {
        console.error("Error in getTrickList:", error);
        res.status(500).json({ error: "An unexpected error occurred" });
    }
}

export async function postTrick(req: Request, res: Response, db: DbConnection, secret: string): Promise<Err | Success> {
    // try {
    //     return await verifyJwt(req, res, secret, async (userId: number) => {
    //         await postTrickHelper(req, res, db, userId);
    //     });
    // } catch (error) {
    //     console.error("Error in postTrick:", error);
    //     res.status(500).json({ error: "Error during trick creation" });
    // }

	return await verifyJwt(req, res, secret, async (userId: number) => {
		await postTrickHelper(req, res, db, userId);
	});
}

async function postTrickHelper(req: Request, res: Response, db: DbConnection, userId: number): Promise<void> {
    try {
        const parts: Array<string> = req.body.parts;
        const spots: Array<Spot> = req.body.spots;
        const date: Date = req.body.date;
        
        const description = new TrickDescription(parts, spots, date);
        const trick: Trick = new Trick(description);

        // SQL-Abfrage für das Hinzufügen eines Tricks
        const query = 'INSERT INTO Tricks(UserId, Name, Points, Date) VALUES (?, ?, ?, ?)';
        const trickId = await new Promise<number>((resolve, reject) => {
            db.query([query,userId, trick.getName(), trick.getPoints(), date], (err, results) => {
                if (err) {
                    reject({
                        type: ErrType.MySqlFailedQuery,
                        message: err.stack ?? "Error inserting trick"
                    });
                }
                resolve(results.insertId);
            });
        });

        // Spots für den Trick hinzufügen
        for (const spot of trick.spots) {
            const spotQuery = 'INSERT INTO Spots(TrickId, Type) VALUES (?, ?)';
            await new Promise<void>((resolve, reject) => {
                db.query([spotQuery, trickId, spot], (err) => {
                    if (err) {
                        reject({
                            type: ErrType.MySqlFailedQuery,
                            message: err.stack ?? "Error inserting spot"
                        });
                    }
                    resolve();
                });
            });
        }

        res.status(200).send("Trick added to the list");
    } catch (error) {
        console.error("Error in postTrickHelper:", error);
        res.status(500).json({ error: "An unexpected error occurred while adding the trick" });
    }
}

export async function deleteTrick(req: Request, res: Response, db: DbConnection, secret: string): Promise<Err | Success> {
    // try {
    //     return await verifyJwt(req, res, secret, async (userId: string) => {
    //         await deleteTrickHelper(req, res, db, userId);
    //     });
    // } catch (error) {
    //     console.error("Error in deleteTrick:", error);
    //     res.status(500).json({ error: "Error during trick deletion" });
    // }

	return await verifyJwt(req, res, secret, async (userId: string) => {
		await deleteTrickHelper(req, res, db, userId);
	});
}

async function deleteTrickHelper(req: Request, res: Response, db: DbConnection, userId: string): Promise<void> {
    try {
        const trickId = req.query.trickId;

        // SQL-Abfrage für das Löschen des Tricks
        const query = 'DELETE FROM Tricks WHERE Tricks.Id=? AND Tricks.UserId=?';
        await new Promise<void>((resolve, reject) => {
            db.query([query,trickId, userId], (err, _) => {
                if (err) {
                    reject({
                        type: ErrType.MySqlFailedQuery,
                        message: err.stack ?? "Error deleting trick"
                    });
                }
                resolve();
            });
        });

        // SQL-Abfrage für das Löschen der Spots
        const spotQuery = 'DELETE FROM Spots WHERE Spots.TrickId=?';
        await new Promise<void>((resolve, reject) => {
            db.query([spotQuery,trickId], (err, _) => {
                if (err) {
                    reject({
                        type: ErrType.MySqlFailedQuery,
                        message: err.stack ?? "Error deleting spots"
                    });
                }
                resolve();
            });
        });

        res.status(200).send("Trick deleted from the trick list");
    } catch (error) {
        console.error("Error in deleteTrickHelper:", error);
        res.status(500).json({ error: "An unexpected error occurred while deleting the trick" });
    }
}
