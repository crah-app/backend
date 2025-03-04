import { Err, ErrType } from './errors.js';
import { Request, Response } from 'express';
import DbConnection from './dbConnection.js';
import { verifyJwt } from './userAuth.js';
import { Trick, TrickDescription } from '../trickLogic/trick.js';
import { Spot } from '../trickLogic/spot.js';

export async function getTrickList(
	req: Request,
	res: Response,
	db: DbConnection,
): Promise<Err | void> {
	const userId: any | undefined = req.query.userId;

	try {
		if (!userId)
			return {
				type: ErrType.RequestMissingProperty,
				message: 'User ID is required',
			};

		const query = `
			SELECT Tricks.Id, Tricks.Name, Tricks.Points, Tricks.Date, Spots.Type
			FROM Tricks
			INNER JOIN Spots ON Tricks.Id = Spots.TrickId
			WHERE Tricks.UserId = ?
		`;

		const trickList = await new Promise<any>((resolve, reject) => {
			db.query(query, userId, (err: any, results: any) => {
				if (err)
					reject({
						type: ErrType.MySqlFailedQuery,
						message: err.code + ' Database query failed',
					});
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

		res.json([...trickList]);
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
	return await verifyJwt(req, res, secret, async (userId: string) => {
		return await postTrickHelper(req, res, db, userId);
	});
}

async function postTrickHelper(
	req: Request,
	res: Response,
	db: DbConnection,
	userId: string,
): Promise<Err | void> {
	const parts: Array<string> = req.body.parts;
	const spots: Array<Spot> = req.body.spots;
	const date: Date = req.body.date;

	try {
		const description = new TrickDescription(parts, spots, date);
		const trick: Trick = new Trick(description);

		// SQL query to insert the trick to the database
		const query =
			'START TRANSACTION; INSERT INTO Tricks(UserId, Name, Points, Date) VALUES (?, ?, ?, ?)';

		const trickId = await new Promise<string>((resolve, reject) => {
			db.query(
				query,
				[userId, trick.getName(), trick.getPoints(), date],
				(err: any, results: any) => {
					if (err) {
						db.query('ROLLBACK', (err: any) => {
							reject({
								type: ErrType.MySqlFailedQuery,
								message: 'Error inserting trick \n' + err.stack,
							});
						});
						resolve(results.insertId);
					}
				},
			);
		});

		const lastIteration = trick.spots.length - 1;
		const spotQuery = 'INSERT INTO Spots(TrickId, Type) VALUES (?, ?)';

		for (let i = 0; i < trick.spots.length; i++) {
			const spot = trick.spots[i];
			const query: string =
				i == lastIteration ? spotQuery + '; COMMIT' : spotQuery;

			await new Promise<void>((resolve, reject) => {
				db.query(query, [trickId, spot], (err: any) => {
					if (err) {
						db.query('ROLLBACK', (err: any) => {
							reject({
								type: ErrType.MySqlFailedQuery,
								message: 'Error inserting spot \n' + err.stack,
							});
						});
					}
					resolve();
				});
			});
		}

		res.status(200).send('Trick added to the trick list');
	} catch (err) {
		return err as Err;
	}
}

export async function deleteTrick(
	req: Request,
	res: Response,
	db: DbConnection,
	secret: string,
): Promise<Err | void> {
	return await verifyJwt(req, res, secret, async (userId: string) => {
		const trickId = req.query.trickId;
		if (!trickId)
			return await deleteTrickHelper(req, res, db, userId, trickId!);
		return {
			type: ErrType.RequestMissingProperty,
			message: 'The request is missing the trickId',
		};
	});
}

export async function deleteTrickHelper(
	req: Request,
	res: Response,
	db: DbConnection,
	userId: string,
	trickId: string,
): Promise<Err | void> {
	const query =
		'START TRANSACTION; DELETE FROM Tricks WHERE Tricks.Id=? AND Tricks.UserId=?';

	try {
		await new Promise<void>((resolve, reject) => {
			db.query(query, [trickId, userId], (err: any) => {
				if (err) {
					reject({
						type: ErrType.MySqlFailedQuery,
						message: err.stack ?? 'Error deleting trick',
					});
				}
				resolve();
			});
		});

		const spotQuery = 'DELETE FROM Spots WHERE Spots.TrickId=?; COMMIT';

		await new Promise<void>((resolve, reject) => {
			db.query(spotQuery, trickId, (err: any) => {
				if (err)
					reject({
						type: ErrType.MySqlFailedQuery,
						message: err.stack ?? 'Error deleting spots',
					});
				resolve();
			});
		});

		res.status(200).send('Trick deleted from the trick list');
	} catch (err) {
		return err as Err;
	}
}

export async function userOwnsTrick(
	db: DbConnection,
	userId: string,
	trickId: string,
): Promise<Err | boolean> {
	const query = 'SELECT * FROM Tricks WHERE Tricks.Id=? AND Tricks.UserId=?';

	try {
		return await new Promise<boolean>((resolve, reject) => {
			db.query(query, [trickId, userId], (err: any, results: any) => {
				if (err)
					reject({
						type: ErrType.MySqlFailedQuery,
						message: err.stack ?? 'Error checking ownership of trick',
					});
				resolve(results !== undefined);
			});
		});
	} catch (err) {
		return err as Err;
	}
}
