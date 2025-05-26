import { Err, ErrType } from './../constants/errors.js';
import { Request, Response } from 'express';
import DbConnection from './../constants/dbConnection.js';
import { verifyJwt } from './auth.js';
import { Trick, TrickDescription, TrickType } from '../trickLogic/trick.js';
import { Spot } from '../trickLogic/spot.js';
import { Pool, PoolConnection } from 'mysql2/promise';
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

		let conn = await db.connect();
		if (conn instanceof Err) return conn;

		const [rows] = await conn.query(query, userId);
		const trickList = [rows];

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
	const conn = await db.connect();
	if (conn instanceof Err) return conn;

	try {
		await conn.beginTransaction();

		// Default-Punkte aus AllTricks holen
		let allTricksData: Err | AllTricksData | undefined = await getTrickData(
			conn,
			name,
		);
		if (allTricksData instanceof Err) throw allTricksData;

		const description = new TrickDescription(parts, spots);
		let trick: Trick = new Trick(description, allTricksData);

		// Falls Trick nicht existiert, hinzufügen
		if (!allTricksData) {
			await addTrickToAllTricks(conn, trick.name, {
				defaultPoints: trick.defaultPoints,
				types: trick.types,
			});
		}

		// Trick einfügen
		const insertTrickQuery = `
			INSERT INTO Tricks(UserId, Name, Points)
			VALUES (?, ?, ?)
		`;

		const [result] = await conn.query(insertTrickQuery, [
			userId,
			trick.getName(),
			trick.getPoints(),
		]);
		const trickId = (result as any).insertId;

		// Spots einfügen
		const insertSpotQuery = `INSERT INTO Spots(TrickId, Spot, Date) VALUES (?, ?, ?)`;

		for (const spotObj of trick.spots) {
			// JS Enums starten bei 0, SQL Enum ab 1
			const spot = spotObj.spot + 1;
			await conn.query(insertSpotQuery, [trickId, spot, spotObj.date]);
		}

		await conn.commit();
		res.status(200).send('Trick added to the trick list');
	} catch (err) {
		await conn.rollback();
		return err as Err;
	} finally {
		conn.release();
	}
}

export async function getTrickData(
	conn: PoolConnection,
	trickName: string,
): Promise<Err | AllTricksData | undefined> {
	try {
		const query = `
			SELECT AllTricks.DefaultPoints, TrickTypes.Type
			FROM AllTricks
			INNER JOIN TrickTypes ON AllTricks.Name = TrickTypes.AllTricksName
			WHERE AllTricks.Name = ?
		`;

		const [rows] = await conn.query(query, [trickName]);

		// rows ist ein Array; wenn nichts gefunden wurde, dann undefined zurückgeben
		if (!rows || (rows as any[]).length === 0) return undefined;

		// Falls du nur den ersten Eintrag brauchst:
		const data = (rows as AllTricksData[])[0];

		if (data.defaultPoints === undefined) return undefined;

		return data;
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
		await conn.beginTransaction();

		const queryAllTricks = `
			INSERT INTO AllTricks(Name, DefaultPoints) VALUES (?, ?)
		`;
		await conn.query(queryAllTricks, [trickName, allTricksData.defaultPoints]);

		const queryTrickTypes = `
			INSERT INTO TrickTypes(AllTricksName, Type) VALUES (?, ?)
		`;

		for (const tType of allTricksData.types) {
			const trickType = tType + 1; // js enums start at 0, mysql enums at 1
			await conn.query(queryTrickTypes, [trickName, trickType]);
		}

		await conn.commit();
	} catch (err) {
		await conn.rollback();
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
	const deleteTrickQuery = `
		DELETE FROM Tricks
		WHERE Tricks.Id = ? AND Tricks.UserId = ?
	`;

	const deleteSpotsQuery = `
		DELETE FROM Spots
		WHERE Spots.TrickId = ?
	`;

	let conn = await db.connect();
	if (conn instanceof Err) return conn;

	try {
		await conn.beginTransaction();

		// Trick löschen
		const [trickResult] = await conn.query(deleteTrickQuery, [trickId, userId]);

		// Optional: prüfen, ob Trick überhaupt gelöscht wurde
		// const affectedRows = (trickResult as any).affectedRows;
		// if (affectedRows === 0) {
		//   throw new Err(ErrType.NotFound, 'Trick not found or not owned by user');
		// }

		// Spots löschen
		await conn.query(deleteSpotsQuery, [trickId]);

		await conn.commit();
		res.status(200).send('Trick deleted from the trick list');
	} catch (err) {
		await conn.rollback();
		return err as Err;
	} finally {
		conn.release();
	}
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
		WHERE Tricks.Id = ?
		AND Tricks.UserId = ?
	`;

	try {
		const conn = await db.connect();
		if (conn instanceof Err) return conn;

		try {
			const [results] = await conn.query(query, [trickId, userId]);
			// Prüfen, ob mindestens ein Eintrag gefunden wurde
			return (results as any[]).length > 0;
		} finally {
			conn.release();
		}
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
		let conn = await db.connect();
		if (conn instanceof Err) return conn;

		const [trick] = await conn.query(query, [trickId]);

		conn.release();
		res.json(trick);
	} catch (err) {
		return err as Err;
	}
}
