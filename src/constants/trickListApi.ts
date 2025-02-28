import { Request, Response } from 'express';
import { verifyJwt } from './userAuth.js';
import { Trick, TrickDescription } from '../trickLogic/trick.js';
import { Spot } from '../trickLogic/spot.js';
import { Pool } from 'mysql2';

type idTrickValueInterface = { id: number, trick: { name: string, spots: string[], date: string, points: number } };

export async function getTrickList(req: Request, res: Response, db: Pool) {
    try {
        const userId = req.query.userId;
        if (!userId) {
            res.status(400).json({ error: "User ID is required" });
            return;
        };

        // SQL-query
        const query = `
            SELECT Tricks.Id, Tricks.Name, Tricks.Points, Tricks.Date, Spots.Type
            FROM Tricks
            INNER JOIN Spots ON Tricks.Id = Spots.TrickId
            WHERE Tricks.UserId = ?;
        `;

        // database query
        let trickList: Array<any> = [];

        await db.query(query, [userId], (err, res) => {
            if(err) console.log("An error occured while query: ",err);
        });

        const idTricks: Map<number, idTrickValueInterface> = new Map();

        // group tricks
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

export async function postTrick(req: Request, res: Response, db: Pool, secret: string) {
    try {
        // Verify JWT and get userId
        await verifyJwt(req, res, secret, async (userId: number) => {
            await postTrickHelper(req, res, db, userId);
        });

    } catch (error) {

        console.error("Error in postTrick:", error);
        res.status(500).json({ error: "An error occurred while adding the trick" });
    }
}

async function postTrickHelper(req: Request, res: Response, db: Pool, userId: number) {
    try {
        const { parts, spots, date }: { parts: string[], spots: Spot[], date: Date } = req.body;
        
        // Create trick description and trick
        const description = new TrickDescription(parts, spots, date);
        const trick = new Trick(description);

        // SQL query to insert trick
        const query = 'INSERT INTO Tricks(UserId, Name, Points, Date) VALUES (?, ?, ?, ?)';
        
        // Perform the query and retrieve the result
        const [result] = await db.promise().query(query, [userId, trick.getName(), trick.getPoints(), date]);
        
        // Get the insertId from the result (it's part of the first element in the result array)
        const trickId = 1 /*result.insertId*/ // `insertId` should be accessible directly from the result

        // Insert spots for the trick
        const spotQuery = 'INSERT INTO Spots(TrickId, Type) VALUES (?, ?)';
        for (const spot of trick.spots) {
            await db.promise().query(spotQuery, [trickId, spot]);
        }

        res.status(200).send("Trick added to the list");
    } catch (error) {
        console.error("Error in postTrickHelper:", error);
        res.status(500).json({ error: "An unexpected error occurred while adding the trick" });
    }
}

export async function deleteTrick(req: Request, res: Response, db: Pool, secret: string) {
    try {
        // Verify JWT and get userId
        await verifyJwt(req, res, secret, async (userId: string) => {
            await deleteTrickHelper(req, res, db, userId);
        });

    } catch (error) {

        console.error("Error in deleteTrick:", error);
        res.status(500).json({ error: "An error occurred while deleting the trick" });
    }
}

async function deleteTrickHelper(req: Request, res: Response, db: Pool, userId: string) {
    try {
        const trickId = req.query.trickId;
        
        // SQL query to delete the trick
        const deleteTrickQuery = 'DELETE FROM Tricks WHERE Tricks.Id=? AND Tricks.UserId=?';
        await db.promise().query(deleteTrickQuery, [trickId, userId]);

        // SQL query to delete associated spots
        const deleteSpotQuery = 'DELETE FROM Spots WHERE Spots.TrickId=?';
        await db.promise().query(deleteSpotQuery, [trickId]);

        res.status(200).send("Trick deleted from the list");

    } catch (error) {

        console.error("Error in deleteTrickHelper:", error);
        res.status(500).json({ error: "An unexpected error occurred while deleting the trick" });
    }
}