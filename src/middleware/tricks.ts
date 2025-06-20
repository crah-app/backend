import { Err, ErrType } from './../constants/errors.js';
import { Request, Response } from 'express';
import DbConnection from './../constants/dbConnection.js';
import { verifyJwt, verifySessionToken } from './auth.js';
import { Trick, TrickDescription } from '../trickLogic/trick.js';
import { PoolConnection } from 'mysql2/promise';
import {
	AllTricksData,
	FullTrick,
	TrickFromDb,
	TrickType,
} from '../types/tricklogic.js';
import { ChecksumAlgorithm } from '@aws-sdk/client-s3';
import { GeneralSpot } from '../trickLogic/spot.js';

/* Get all tricks from db */
export async function getAllTricks(
	req: Request,
	res: Response,
	db: DbConnection,
): Promise<Err | void> {
	try {
		let conn = await db.connect();
		if (conn instanceof Err) return conn;

		const query = `
		SELECT 
			a.Name, 
			a.DefaultPoints, 
			a.Costum, 
			t.Type
		FROM alltricks a
		LEFT JOIN (
			SELECT AllTricksName, \`Type\` 
			FROM TrickTypes
		) t ON t.AllTricksName = a.Name;
		`;

		const [rows] = await conn.query(query);

		conn.release();
		res.status(200).json(rows);
	} catch (err) {
		res.status(500).json({ success: false, message: err });
		return err as Err;
	}
}

/* 
	Get all tricks from user

	@depricated

	do not use
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
					Name: row.Name,
					Spots: [row.Type, row.Date],
					Points: row.Points,
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
	const spots: Array<{ spot: GeneralSpot; date?: Date }> = req.body.spots;

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
			await addTrickToAllTricks(conn, trick.Name, {
				Name: trick.Name,
				DefaultPoints: trick.DefaultPoints,
				Costum: trick.Costum,
				Difficulty: trick.Difficulty,
				Types: trick.Types,
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
		const insertSpotQuery = `INSERT INTO GeneralSpots(TrickId, Spot, Date) VALUES (?, ?, ?)`;

		for (const spotObj of trick.Spots) {
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
	return undefined;
	try {
		const query = `
			SELECT AllTricks.Name, AllTricks.DefaultPoints,AllTricks.Costum, AllTricks.Difficulty, AllTricks.SecondName, TrickTypes.Type
			FROM AllTricks
			INNER JOIN TrickTypes ON AllTricks.Name = TrickTypes.AllTricksName
			WHERE AllTricks.Name = ?
		`;

		const [rows] = await conn.query(query, [trickName]);

		if (!rows || (rows as any[]).length === 0) return undefined;

		// only the first row
		const data = (rows as AllTricksData[])[0];

		if (data.DefaultPoints === undefined) return undefined;

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
		await conn.query(queryAllTricks, [trickName, allTricksData.DefaultPoints]);

		const queryTrickTypes = `
			INSERT INTO TrickTypes(AllTricksName, Type) VALUES (?, ?)
		`;

		for (const tType of allTricksData.Types) {
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
		DELETE FROM GeneralSpots
		WHERE GeneralSpots.TrickId = ?
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

// current-user initiaizes/updates his (5) best tricks
export async function setCurrentUserTricks(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const url_userId = req.params.userId;
	const tricks = req.body.tricks;

	try {
		const { sessionToken } = await verifySessionToken(req, res);
		const userId = sessionToken.sub;

		if (userId !== url_userId) {
			return res.status(401).json({ error: 'Not Authenticated' });
		}

		if (!tricks) {
			console.warn('Trick is required');
			return new Err(ErrType.RequestMissingProperty, 'Tricks is required');
		}

		console.log('tricks', tricks);

		const points = await getPointsOfTrickArray(tricks, db, userId);

		// this is the rank value of the user
		const avg = points / tricks.length;

		res.status(200);
		res.json({ user_points: avg.toFixed(0) });
	} catch (err) {
		res.status(404);
		res.json({ error: err });
		return err as Err;
	}
}

// when the current user submits his 5 best tricks, we need to calculate the "DefaultPoints" for every trick
// based on the trick words and spot
export async function getPointsOfTrickArray(
	tricks: TrickFromDb[],
	db: DbConnection,
	userId: string,
) {
	let pointsOfTricks: number[] = [];
	let totalPoints: number = 0;

	try {
		for (let i = 0; i < tricks.length; i++) {
			pointsOfTricks[i] = await getPointsOfTrick(tricks[i], db, userId);
			totalPoints += pointsOfTricks[i];
		}

		return totalPoints;
	} catch (err) {
		console.warn('Error setting up trick array: ', err);
		return 0;
	}
}

export async function getPointsOfTrick(
	trick: TrickFromDb,
	db: DbConnection,
	userId: string,
): Promise<number> {
	const conn = await db.connect();
	if (conn instanceof Err) return 0;

	try {
		await conn.beginTransaction();

		const trickName = trick.Name;
		const trickNameParts = trickName.split(' ');
		const trickSpot = trick.Spot;

		// get default-points from the allTricks table
		let allTricksData: Err | AllTricksData | undefined = await getTrickData(
			conn,
			trickName,
		);

		console.log('all tricks data:', allTricksData);

		if (allTricksData instanceof Err) throw allTricksData;

		const description = new TrickDescription(trickNameParts, [
			{ spot: trickSpot },
		]);

		console.log('trick description:', description);

		let created_trick: Trick = new Trick(description, allTricksData);

		console.log('created_trick:', created_trick);

		// Falls Trick nicht existiert, hinzufügen
		if (!allTricksData) {
			await addTrickToAllTricks(conn, created_trick.Name, {
				Name: created_trick.Name,
				DefaultPoints: created_trick.DefaultPoints,
				Costum: created_trick.Costum,
				Difficulty: created_trick.Difficulty,
				Types: created_trick.Types || [TrickType.Overhead],
			});
		}

		// Trick einfügen
		const insertTrickQuery = `
			INSERT INTO Tricks(UserId, Name, Points)
			VALUES (?, ?, ?)
		`;

		const [result] = await conn.query(insertTrickQuery, [
			userId,
			created_trick.getName(),
			created_trick.getPoints(),
		]);
		const trickId = (result as any).insertId;

		console.log('trick id:', trickId);

		// insert spots
		const insertSpotQuery = `INSERT INTO GeneralSpots(TrickId, Spot, Date) VALUES (?, ?, ?)`;

		for (const spotObj of created_trick.Spots) {
			// "Park" | "Street" | "Flat"
			const spot = spotObj.spot;
			// insert row for every spot the user landed the trick
			await conn.query(insertSpotQuery, [trickId, spot, spotObj.date]);
		}

		await conn.commit();
		return created_trick.Points;
	} catch (err) {
		await conn.rollback();
		console.warn('Error setting up trick: ', err);
		return 0;
	} finally {
		conn.release();
	}
}
