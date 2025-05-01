import { Err, ErrType } from './../constants/errors.js';
import { Request, Response } from 'express';
import DbConnection from './../constants/dbConnection.js';
import { verifyJwt } from './auth.js';
import { Trick, TrickDescription, TrickType } from '../trickLogic/trick.js';
import { Spot } from '../trickLogic/spot.js';
import { Pool, PoolConnection } from 'mysql2';
import { AllowlistIdentifier } from '@clerk/backend';

export interface AllTricksData {
	defaultPoints: number;
	types: TrickType[];
}

/* 
	Get all tricks from user
*/
export async function getTricks(
	req: Request,
	res: Response,
	db: DbConnection,
): Promise<Err | void> {
	const userId: any | undefined = req.params.userId;

	try {
		if (!userId)
			return new Err(ErrType.RequestMissingProperty, 'User ID is required');

		const query = `
			SELECT Tricks.Id, Tricks.Name, Tricks.Points, Tricks.Date, Spots.Type
			FROM Tricks
			INNER JOIN Spots ON Tricks.Id = Spots.TrickId
			WHERE Tricks.UserId = ?
		`;

		let conn: PoolConnection | Err = await db.connect();
		if (conn instanceof Err) return conn;

		const trickList = await new Promise<any>((resolve, reject) => {
			conn.query(query, userId, (err: any, results: any) => {
				if (err) {
					reject(new Err(ErrType.MySqlFailedQuery, err));
					return;
				}

				resolve(results);
			});
		});

		const idTricks: Map<number, Partial<Trick>> = new Map();

		trickList.forEach((row: any) => {
			let trick: any | undefined = idTricks.get(row.Id);

			if (trick!) trick.spots?.push([row.Type, row.Date]);
			else
				idTricks.set(row.Id, {
					name: row.Name,
					spots: [row.Type, row.Date],
					points: row.Points,
				});
		});

		conn.release();
		res.json([...Array.from(idTricks)]);
	} catch (err) {
		return err as Err;
	}
}

/*
	User tries to create new trick
*/
export async function postTrick(
	req: Request,
	res: Response,
	db: DbConnection,
	secret: string,
): Promise<Err | void> {
	return await verifyJwt(req, res, secret, (userId: string) =>
		handlePostTrick(req, res, db, userId),
	);
}

async function handlePostTrick(
	req: Request,
	res: Response,
	db: DbConnection,
	userId: string,
): Promise<void | Err> {
	const parts: Array<string> = req.body.parts;
	const spots: Array<{ spot: Spot; date?: Date }> = req.body.spots;

	const name = parts.join(' ');
	try {
		const conn: PoolConnection | Err = await db.connect();
		if (conn instanceof Err) return conn;

		// First, check if we already calculated the defaultPoints in AllTricks
		let allTricksData: Err | AllTricksData | undefined = await getTrickData(
			conn,
			name,
		);

		if (allTricksData instanceof Err) return allTricksData as Err;

		const description = new TrickDescription(parts, spots);

		// The trick builder is going to use them if they aren't undefined, if not it is going
		// to build the trick from scratch
		let trick: Trick = new Trick(description, allTricksData);

		// In this case it is missing from AllTricks
		if (!allTricksData) {
			await addTrickToAllTricks(conn, trick.name, {
				defaultPoints: trick.defaultPoints,
				types: trick.types,
			});
		}

		// SQL query to insert the trick to the database
		const query = `
			INSERT INTO Tricks(UserId, Name, Points)
			VALUES (?, ?, ?)
		`;

		const trickId = await new Promise<any>((resolve, reject) => {
			conn.query('START TRANSACTION');

			const params = [userId, trick.getName(), trick.getPoints()];

			conn.query(query, params, (err: any, results: any) => {
				if (err) {
					conn.release();
					reject(new Err(ErrType.MySqlFailedQuery, err));
					return;
				}
				resolve(results.insertId);
			});
		});

		const lastIteration = trick.spots.length - 1;

		const spotQuery = `INSERT INTO Spots(TrickId, Spot, Date) VALUES (?, ?, ?)`;

		for (let i = 0; i < trick.spots.length; i++) {
			// js enums start from 0, but sql enums start at 1 to point to a variant
			const spot = trick.spots[i].spot + 1;

			await new Promise<void>((resolve, reject) => {
				conn.query(
					spotQuery,
					[trickId, spot, trick.spots[i].date],
					(err: any) => {
						if (err) {
							conn.query('ROLLBACK');
							reject(new Err(ErrType.MySqlFailedQuery, err));
							return;
						}
						if (i == lastIteration) {
							conn.query('COMMIT');
						}
						resolve();
					},
				);
			});
		}

		conn.release();
	} catch (err) {
		return err as Err;
	}

	res.status(200).send('Trick added to the trick list');
}

export async function getTrickData(
	conn: PoolConnection,
	trickName: string,
): Promise<Err | AllTricksData | undefined> {
	try {
		// SQL query to get default points and types of the trick
		const query = `
			SELECT AllTricks.DefaultPoints, TrickTypes.Type
			FROM AllTricks
			INNER JOIN TrickTypes ON AllTricks.Name = TrickTypes.AllTricksName
			WHERE AllTricks.Name = ?
		`;

		const data = await new Promise<any>((resolve, reject) => {
			conn.query(query, [trickName], (err: any, results: any) => {
				if (err) {
					conn.release();
					reject(new Err(ErrType.MySqlFailedQuery, err));
					return;
				}
				resolve(results);
			});
		});

		if (data.defaultPoints == undefined) return undefined;
		return data as AllTricksData;
	} catch (err) {
		return err as Err;
	}
}

/* 
	Add costum trick to the "AllTricks" table
*/
export async function addTrickToAllTricks(
	conn: PoolConnection,
	trickName: string,
	allTricksData: AllTricksData,
): Promise<Err | void> {
	try {
		// SQL query to get default points
		conn.query('START TRANSACTION');

		const queryAllTricks = `
			INSERT INTO AllTricks(Name, DefaultPoints) VALUES (?, ?)
		`;

		await new Promise<any>((resolve, reject) => {
			conn.query(
				queryAllTricks,
				[trickName, allTricksData.defaultPoints],
				(err: any, results: any) => {
					if (err) {
						conn.release();
						reject(new Err(ErrType.MySqlFailedQuery, err));
						return;
					}
					resolve(results);
				},
			);
		});

		const queryTrickTypes = `
			INSERT INTO TrickTypes(AllTricksName, Type) VALUES (?, ?)
		`;

		for (let tType of allTricksData.types) {
			// js enums start from 0 but mysql enums start from 1
			let trickType = tType + 1;

			await new Promise<any>((resolve, reject) => {
				conn.query(
					queryTrickTypes,
					[trickName, trickType],
					(err: any, results: any) => {
						if (err) {
							conn.query('ROLLBACK');
							conn.release();
							reject(new Err(ErrType.MySqlFailedQuery, err));
							return;
						}

						resolve(results);
					},
				);
			});
		}

		conn.query('COMMIT');
	} catch (err) {
		return err as Err;
	}
}

/*
	Try to delete a trick
*/
export async function deleteTrick(
	req: Request,
	res: Response,
	db: DbConnection,
	secret: string,
): Promise<Err | void> {
	return await verifyJwt(req, res, secret, async (userId: string) => {
		const trickId = req.params.trickId;
		if (!trickId)
			return new Err(
				ErrType.RequestMissingProperty,
				'The request is missing the trickId',
			);
		return await HandleDeleteTrick(res, db, userId, trickId!);
	});
}

export async function HandleDeleteTrick(
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
		if (conn instanceof Err) return conn;

		await new Promise<void>((resolve, reject) => {
			conn.query('START TRANSACTION');
			conn.query(query, [trickId, userId], (err: any) => {
				if (err) {
					conn.release();
					reject(
						new Err(
							ErrType.MySqlFailedQuery,
							err.stack ?? 'Error deleting trick',
						),
					);
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
					conn.query('ROLLBACK');
					reject(
						new Err(
							ErrType.MySqlFailedQuery,
							err.stack ?? 'Error deleting spots',
						),
					);
				}
				resolve();
			});
			conn.query('COMMIT');
		});

		conn.release();
	} catch (err) {
		return err as Err;
	}
	res.status(200).send('Trick deleted from the trick list');
}

/*
	returns boolean wether user landed the trick
*/
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
		if (conn instanceof Err) return conn;

		return await new Promise<boolean>((resolve, reject) => {
			conn.query(query, [trickId, userId], (err: any, results: any) => {
				conn.release();
				if (err)
					reject(
						new Err(
							ErrType.MySqlFailedQuery,
							err.stack ?? 'Error checking ownership of trick',
						),
					);
				resolve(results !== undefined);
			});
		});
	} catch (err) {
		return err as Err;
	}
}

// get trick
export async function getTrick(
	req: Request,
	res: Response,
	db: DbConnection,
): Promise<Err | void> {
	const trickId = req.params.trickId;

	const query = `
		SELECT * FROM AllTricks
		WHERE Id = ?;
	`;

	try {
		let conn: PoolConnection | Err = await db.connect();
		if (conn instanceof Err) return conn;

		const trick = await new Promise<void>((resolve, reject) => {
			conn.query(query, [trickId], (err: any, results: any) => {
				if (err) {
					reject(new Err(ErrType.MySqlFailedQuery, err));
					return;
				}
				resolve(results);
			});
		});

		conn.release();
		res.json(trick);
	} catch (err) {
		return err as Err;
	}
}
