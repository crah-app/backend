import { Err, ErrType } from './../constants/errors.js';
import { Request, Response } from 'express';
import DbConnection from './../constants/dbConnection.js';
import { verifyJwt } from './auth.js';
import { Trick, TrickDescription } from '../trickLogic/trick.js';
import { Spot } from '../trickLogic/spot.js';
import { PoolConnection } from 'mysql2';

export async function getTricks(req: Request, res: Response, db: DbConnection): Promise<Err | void> {
	const userId: any | undefined = req.params.userId;

	try {
		if (!userId) return new Err(
			ErrType.RequestMissingProperty,
			'User ID is required'
		);

		const query = `
			SELECT Tricks.Id, Tricks.Name, Tricks.Points, Tricks.Date, Spots.Type
			FROM Tricks
			INNER JOIN Spots ON Tricks.Id = Spots.TrickId
			WHERE Tricks.UserId = ?
		`;

		let conn: PoolConnection | Err = await db.connect();
		if(conn instanceof Err) return conn;

		const trickList = await new Promise<any>((resolve, reject) => {
			conn.query(query, userId, (err: any, results: any) => {
				if (err) {
					reject(new Err(
						ErrType.MySqlFailedQuery,
						err,
					));
					return;
				}
				
				resolve(results);
			});
		});

		const idTricks: Map<number, Partial<Trick>> = new Map();

		trickList.forEach((row: any) => {
			let trick: any | undefined = idTricks.get(row.Id);

			if (trick!) trick.spots?.push(row.Type);
			else
				idTricks.set(row.Id, {
					name: row.Name,
					spots: [row.Type],
					date: row.Date,
					points: row.Points,
				});
		});

		conn.release();
		res.json([...Array.from(idTricks)]);
	} catch (err) {
		return err as Err;
	}
}

export async function postTrick(
	req: Request,
	res: Response,
	db: DbConnection,
	secret: string,
): Promise<Err | void> {
	return await verifyJwt(
		req,
		res,
		secret,
		(userId: string) => postTrickHelper(req, res, db, userId)
	);
}

async function postTrickHelper(
	req: Request,
	res: Response,
	db: DbConnection,
	userId: string,
): Promise<void | Err> {
	const parts: Array<string> = req.body.parts;
	const spots: Array<Spot> = req.body.spots;
	const date: Date = req.body.date;

	try {
		const description = new TrickDescription(parts, spots, date);
		const trick: Trick = new Trick(description);

		// SQL query to insert the trick to the database
		const query = `
			INSERT INTO Tricks(UserId, Name, Points, Date)
			VALUES (?, ?, ?, ?)
		`;
		
		const conn: PoolConnection | Err = await db.connect();
		if(conn instanceof Err) return conn;

		const trickId = await new Promise<any>((resolve, reject) => {
			conn.query('START TRANSACTION');
			
			const params = [userId, trick.getName(), trick.getPoints(), date];
			
			conn.query(query, params, (err: any, results: any) => {
					if (err) {
						conn.release();
						reject(new Err(
							ErrType.MySqlFailedQuery,
							err
						));
						return;
					}
					resolve(results.insertId);
				},
			);
		});
		
		const lastIteration = trick.spots.length - 1;

		const spotQuery = `INSERT INTO Spots(TrickId, Type) VALUES (?, ?)`;

		for (let i = 0; i < trick.spots.length; i++) {
			// js enums start from 0, but sql enums start at 1 to point to a variant
			const spot = trick.spots[i] + 1;

			await new Promise<void>((resolve, reject) => {
				conn.query(spotQuery, [trickId, spot], (err: any) => {
					if (err) {
						conn.query('ROLLBACK');
						reject(new Err(
							ErrType.MySqlFailedQuery,
							err
						));
						return;
					}
					if(i == lastIteration) {
						conn.query('COMMIT');
					}
					resolve();
				});
			})
		}

		conn.release();
	} catch (err) {
		return err as Err;
	}
	
	res.status(200).send('Trick added to the trick list');
}

export async function deleteTrick(
	req: Request,
	res: Response,
	db: DbConnection,
	secret: string,
): Promise<Err | void> {
	return await verifyJwt(req, res, secret, async (userId: string) => {
		const trickId = req.params.trickId;
		if (!trickId) return new Err(
			ErrType.RequestMissingProperty,
			'The request is missing the trickId',
		);
		return await deleteTrickHelper(res, db, userId, trickId!);
	});
}

export async function deleteTrickHelper(
	res: Response,
	db: DbConnection,
	userId: string,
	trickId: string,
): Promise<Err | void> {
	
	const query = `
		DELETE FROM Tricks
		WHERE Tricks.Id=?
		AND Tricks.UserId=?
	`;

	try {
		const conn = await db.connect();
		if(conn instanceof Err) return conn;

		await new Promise<void>((resolve, reject) => {
			conn.query('START TRANSACTION');
			conn.query(query, [trickId, userId], (err: any) => {
				if (err) {
					conn.release();
					reject(new Err(
						ErrType.MySqlFailedQuery,
						err.stack ?? 'Error deleting trick',
					));
					return;
				}
				resolve();
			});
		});

		const spotQuery = `
			DELETE FROM Spots
			WHERE Spots.TrickId=?
		`;

		await new Promise<void>((resolve, reject) => {
			conn.query(spotQuery, trickId, (err: any) => {
				if (err) {
					conn.release();
					conn.query("ROLLBACK");
					reject(new Err(
						ErrType.MySqlFailedQuery,
						err.stack ?? 'Error deleting spots',
					));
				}
				resolve();
			});
			conn.query("COMMIT");
		});
		
		conn.release();
	} catch (err) {
		return err as Err;
	}
	res.status(200).send('Trick deleted from the trick list');
}

export async function userOwnsTrick(
	db: DbConnection,
	userId: string,
	trickId: string,
): Promise<Err | boolean> {
	const query = `
		SELECT * FROM Tricks
		WHERE Tricks.Id=?
		AND Tricks.UserId=?
	`;

	try {
		const conn = await db.connect();
		if(conn instanceof Err) return conn;

		return await new Promise<boolean>((resolve, reject) => {
			conn.query(query, [trickId, userId], (err: any, results: any) => {
				conn.release();
				if (err)
					reject(new Err(
						ErrType.MySqlFailedQuery,
						err.stack ?? 'Error checking ownership of trick',
					));
				resolve(results !== undefined);
			});
		});
	} catch (err) {
		return err as Err;
	}
}
