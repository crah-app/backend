import { Err, ErrType } from './../constants/errors.js';
import { Request, Response } from 'express';
import DbConnection from './../constants/dbConnection.js';
import { verifyJwt, verifySessionToken } from './auth.js';
import { Trick, TrickDescription } from '../trickLogic/trick.js';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';
import {
	AllTricksData,
	FullTrick,
	TrickDifficulty,
	TrickDifficultyOrder,
	TrickFromDb,
	TrickFromFrontend,
	TrickType,
} from '../types/tricklogic.js';
import { ChecksumAlgorithm } from '@aws-sdk/client-s3';
import { GeneralSpot } from '../trickLogic/spot.js';
import { setUserRank } from './ranks.js';

// Get all existing tricks
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

// Get one trick
export async function getTrickData(
	conn: PoolConnection,
	trickName: string,
): Promise<Err | AllTricksData | undefined> {
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

// Add one trick
export async function addTrickToAllTricks(
	conn: PoolConnection,
	trickName: string,
	allTricksData: AllTricksData,
): Promise<Err | void> {
	try {
		const queryAllTricks = `
			INSERT INTO AllTricks(\`Name\`, DefaultPoints, Costum, Difficulty, SecondName) VALUES (?, ?, ?, ?, ?)
			ON DUPLICATE KEY UPDATE
			DefaultPoints = VALUES(DefaultPoints),
			Costum = VALUES(Costum),
			Difficulty = VALUES(Difficulty),
			SecondName = VALUES(SecondName)
		`;

		await conn.query(queryAllTricks, [
			trickName,
			allTricksData.DefaultPoints,
			allTricksData.Costum,
			allTricksData.Difficulty,
			null, // parse null as secondName
		]);

		const queryTrickTypes = `
			INSERT INTO TrickTypes(AllTricksName, \`Type\`) VALUES (?, ?)
		`;

		for (const tType of allTricksData.Types) {
			const trickType = tType + 1; // js enums start at 0, mysql enums at 1
			await conn.query(queryTrickTypes, [trickName, trickType]);
		}

		if (allTricksData.Types.length <= 0) {
			await conn.query(queryTrickTypes, [trickName, 'None']);
		}
	} catch (err) {
		console.warn(err);
		await conn.rollback();
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

// current-user initiaizes/updates his best tricks
export async function setCurrentUserTricks(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const url_userId: string = req.params.userId;
	const tricks: TrickFromFrontend[] = req.body.tricks;

	try {
		const { sessionToken } = await verifySessionToken(req, res);

		if (!sessionToken) return;

		const userId = sessionToken.sub;

		if (userId !== url_userId) {
			return res.status(401).json({ error: 'Not Authenticated' });
		}

		if (!tricks) {
			console.warn('Trick is required');
			return new Err(ErrType.RequestMissingProperty, 'Tricks is required');
		}

		const [
			trickTotalPoints,
			bestTrickDifficulty,
			bestTrickName,
			bestTrickSpots,
			unrecognizedWord,
		] = await getPointsOfTrickArray(tricks as TrickFromDb[], db, userId);

		// current-user typed in a trick word that does not exist in the word json list
		if (unrecognizedWord) {
			return res.status(404).send({
				unrecognized_word: unrecognizedWord,
			});
		}

		const bestTricks = await handleGetOverallBestTricksOfUser(db, userId);

		if (bestTricks.err || !bestTricks.rows) {
			throw Error(
				`Operation Failed: Couldn't get overall best tricks of current-user: ${bestTricks.err}`,
			);
		}

		// @ts-ignore
		const pointsOfBestTricks = bestTricks.rows.reduce((acc, curr) => {
			return acc + curr.Points;
		}, 0);

		// this is the rank point-value of the user
		// @ts-ignore
		const avg = pointsOfBestTricks / bestTricks.rows.length;

		const { new_rank, old_rank } = await setUserRank(userId, avg, db);

		// returns average user points, total user points, user rank, total points of all added tricks, trick Difficulty of best trick added
		res.status(200).json({
			user_points: avg.toFixed(0),
			user_total_points: pointsOfBestTricks,
			trick_total_points: trickTotalPoints,
			best_trick_difficulty: bestTrickDifficulty,
			best_trick_name: bestTrickName,
			best_trick_spots: bestTrickSpots,
			new_rank,
			old_rank,
		});
	} catch (err) {
		res.status(500).json({ error: err });
		console.warn('Error [setCurrentUserTricks]', err);
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
	let bestTrickDifficulty: TrickDifficulty = TrickDifficulty.Unknown;
	let bestTrickName: string = 'Unknown 0';
	let bestTrickSpots: {
		spot: GeneralSpot;
		date?: Date;
	}[] = [];

	try {
		for (let i = 0; i < tricks.length; i++) {
			const trick: Trick = await getPointsOfTrick(tricks[i], db, userId);

			if (trick.unrecognizedWord) {
				console.log('[getPointsOfTrickArray]', trick);
				return [
					0,
					trick.Difficulty,
					bestTrickName,
					bestTrickSpots,
					trick.unrecognizedWord,
				];
			}

			pointsOfTricks[i] = trick.Points;
			totalPoints += pointsOfTricks[i];

			if (
				TrickDifficultyOrder[bestTrickDifficulty] <
				TrickDifficultyOrder[trick.Difficulty]
			) {
				bestTrickDifficulty = trick.Difficulty;
				bestTrickName = trick.Name;
				bestTrickSpots = trick.Spots;
			}
		}

		return [
			totalPoints,
			bestTrickDifficulty,
			bestTrickName,
			bestTrickSpots,
			null,
		];
	} catch (err) {
		console.warn('Error setting up trick array: ', err);
		return [0, TrickDifficulty.Beginner, bestTrickName, bestTrickSpots, null];
	}
}

export async function getPointsOfTrick(
	trick: TrickFromDb,
	db: DbConnection,
	userId: string,
): Promise<Trick> {
	const conn = await db.connect();
	if (conn instanceof Err) return {} as Trick;

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

		if (allTricksData instanceof Err) throw allTricksData;

		const description = new TrickDescription(trickNameParts, [
			{ spot: trickSpot },
		]);

		console.log('trick description', description);

		let created_trick: Trick = new Trick(description, allTricksData);

		if (typeof created_trick.unrecognizedWord === 'string') {
			return created_trick;
		}

		console.log('created_trick:', created_trick);

		// add trick to allTricks table if it does not exist yet
		if (!allTricksData) {
			await addTrickToAllTricks(conn, created_trick.Name, {
				Name: created_trick.Name,
				DefaultPoints: created_trick.DefaultPoints,
				Costum: created_trick.Costum,
				Difficulty: created_trick.getDefaultDifficulty(),
				Types: created_trick.Types,
			});
		}

		// insert trick
		const insertTrickQuery = `
		INSERT INTO Tricks(UserId, Name)
		VALUES (?, ?)
		ON DUPLICATE KEY UPDATE 
		  Id = LAST_INSERT_ID(Id);
		`;

		const [insertResult] = await conn.query(insertTrickQuery, [
			userId,
			created_trick.getName(),
		]);

		const trickId = (insertResult as any).insertId;
		console.log('trick id:', trickId);

		// insert spots
		const insertSpotQuery = `
			INSERT INTO GeneralSpots(TrickId, Spot, Date, Points, Difficulty)
			VALUES (?, ?, ?, ?, ?)
			ON DUPLICATE KEY UPDATE Date = VALUES(Date)
			`;

		for (const spotObj of created_trick.Spots) {
			// "Park" | "Street" | "Flat"
			const spot = spotObj.spot;
			// insert row for every spot the user landed the trick
			await conn.query(insertSpotQuery, [
				trickId,
				spot,
				spotObj.date,
				created_trick.getPoints(),
				created_trick.Difficulty,
			]);
		}

		await conn.commit();
		return created_trick;
	} catch (err) {
		await conn.rollback();
		console.warn('Error setting up trick: ', err);
		return {} as Trick;
	} finally {
		conn.release();
	}
}

// get five best tricks of user
export async function getBestTricksOfUser(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const userId = req.params.userId;

	const result = await handleGetBestTricksOfUser(db, userId);

	if (result.err) {
		res.json({ error: result.error });
		return;
	}

	res.json(result);
}

/* 
	returns top 5 best tricks of user in each general spot (Park, Street, Flat) including points and point-average
*/
export async function handleGetBestTricksOfUser(
	db: DbConnection,
	userId: string,
) {
	const conn = await db.connect();
	if (conn instanceof Err) return { err: true };

	const query = `
		SELECT 
		sub.TrickId,
		sub.UserId,
		sub.Name,
		sub.Points,
		sub.Difficulty,
		sub.Spot,
		sub.Date
		FROM (
		SELECT
			g.TrickId,
			t.UserId,
			t.Name,
			g.Points,
			g.Difficulty,
			g.Spot,
			g.Date,
			ROW_NUMBER() OVER (PARTITION BY g.Spot ORDER BY g.Points DESC) AS rn
		FROM tricks t
		INNER JOIN generalspots g ON t.Id = g.TrickId
		WHERE t.UserId = ?
		) AS sub
		WHERE sub.rn <= 5;
	`;

	type Trick = RowDataPacket & {
		TrickId: number;
		UserId: string;
		Name: string;
		Points: number;
		Difficulty: string;
		Spot: string;
		Date: string;
	};

	try {
		const [rows] = await conn.query<Trick[]>(query, [userId]);

		const grouped: Record<string, Trick[]> = {};

		for (const row of rows) {
			if (!grouped[row.Spot]) {
				grouped[row.Spot] = [];
			}
			grouped[row.Spot].push(row);
		}

		return { err: false, error: null, rows: grouped ?? [] };
	} catch (error) {
		return { err: true, error };
	} finally {
		conn.release();
	}
}

// get overall best tricks of user
export async function getOverallBestTricksOfUser(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const userId = req.params.userId;

	const result = await handleGetOverallBestTricksOfUser(db, userId);

	if (result.err) {
		res.json({ error: result.error });
		return;
	}

	res.json(result.rows);
}

// returns overall best tricks of user
export async function handleGetOverallBestTricksOfUser(
	db: DbConnection,
	userId: string,
) {
	const conn = await db.connect();
	if (conn instanceof Err) return { err: true };

	const query = `
		SELECT 
			generalspots.TrickId,
			tricks.UserId,
			tricks.Name,
			generalspots.Points,
			generalspots.Difficulty,
			generalspots.Spot,
			generalspots.Date
		FROM tricks
		INNER JOIN generalspots ON tricks.Id = generalspots.TrickId
		WHERE tricks.UserId = ?
		ORDER BY generalspots.Points DESC
		LIMIT 5;
	`;

	try {
		const [rows] = await conn.query(query, [userId]);

		return { err: false, error: null, rows: rows ?? [] };
	} catch (err) {
		return { err: true, error: err };
	} finally {
		conn.release();
	}
}

// get all tricks of user
export async function getAllTricksOfUser(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const userId = req.params.userId;

	const result = await handleGetAllTricksOfUser(db, userId);

	if (result.err) {
		res.json({ error: result.error });
		return;
	}

	res.json(result.rows);
}

// returns all tricks in a json
export async function handleGetAllTricksOfUser(
	db: DbConnection,
	userId: string,
) {
	const conn = await db.connect();
	if (conn instanceof Err) return { err: true };

	const query = `
		SELECT 
			generalspots.TrickId,
			tricks.UserId,
			tricks.Name,
			generalspots.Points,
			generalspots.Difficulty,
			generalspots.Spot,
			generalspots.Date
		FROM tricks
		INNER JOIN generalspots ON tricks.Id = generalspots.TrickId
		WHERE tricks.UserId = ?;
	`;

	try {
		const [rows] = await conn.query(query, [userId]);

		return { err: false, error: null, rows: rows ?? [] };
	} catch (error) {
		return { err: true, error };
	} finally {
		conn.release();
	}
}

// get points of one trick. If trick doesn`t exist yet create it
// If can`t create trick throw error
export async function getPointsOfTricks(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	try {
		const tricks = req.body.tricks;

		if (!tricks) {
			return res.status(400).json({ message: 'No trick array' });
		}

		const result = await getPointsOfTrickArray_allTricksTableModifier(
			tricks,
			db,
		);

		return res.status(200).json(result);
	} catch (error) {
		console.warn('[getPointsOfTrick] Error:', error);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
}

// when the current user submits his 5 best tricks, we need to calculate the "DefaultPoints" for every trick
// based on the trick words and spot
export async function getPointsOfTrickArray_allTricksTableModifier(
	tricks: TrickFromDb[],
	db: DbConnection,
) {
	try {
		const createdTricks: Array<Trick | Err> = await Promise.all(
			tricks.map((trick) => getPointsOfTrick_allTricksTableModifier(trick, db)),
		);

		if (createdTricks.some((trick) => trick instanceof Err)) {
			throw new Error('At least one trick failed.');
		}

		const validTricks = createdTricks.filter(
			(t): t is Trick => !(t instanceof Err),
		);
		const totalPoints = validTricks.reduce(
			(sum, trick) => sum + trick.Points,
			0,
		);
		const pointAvg = tricks.length > 0 ? totalPoints / tricks.length : 0;

		return {
			tricks: createdTricks,
			totalPoints,
			pointAvg,
		};
	} catch (err) {
		console.error('Error setting up trick array:', err);
		throw err;
	}
}

export async function getPointsOfTrick_allTricksTableModifier(
	trick: TrickFromDb,
	db: DbConnection,
): Promise<Trick | Err> {
	const conn = await db.connect();
	if (conn instanceof Err) return conn as Err;

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

		if (allTricksData instanceof Err) throw allTricksData;

		const description = new TrickDescription(trickNameParts, [
			{ spot: trickSpot },
		]);

		let created_trick: Trick = new Trick(description, allTricksData);

		console.log('created_trick:', created_trick);

		// Add trick to allTricks table f trick does not exist yet
		if (!allTricksData) {
			await addTrickToAllTricks(conn, created_trick.Name, {
				Name: created_trick.Name,
				DefaultPoints: created_trick.DefaultPoints,
				Costum: created_trick.Costum,
				Difficulty: created_trick.getDefaultDifficulty(),
				Types: created_trick.Types,
			});
		}

		await conn.commit();
		return created_trick;
	} catch (err) {
		await conn.rollback();
		console.warn('Error setting up trick: ', err);
		return err as Err;
	} finally {
		conn.release();
	}
}

export async function getBestTrickOfUser(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const userId = req.params.userId;

	try {
		const result = await handleGetBestTrickOfUser(db, userId);

		return res.status(200).json(result);
	} catch (error) {
		console.warn('[getBestTrickOfUser] Error:', error);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
}

// get single best trick of user
export async function handleGetBestTrickOfUser(
	db: DbConnection,
	userId: string,
) {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	try {
		const query = `
		SELECT 
			generalspots.TrickId,
			tricks.UserId,
			tricks.Name,
			generalspots.Points,
			generalspots.Difficulty,
			generalspots.Spot,
			generalspots.Date
		FROM tricks
		INNER JOIN generalspots ON tricks.Id = generalspots.TrickId
		WHERE tricks.UserId = ?
		ORDER BY generalspots.Points DESC
		LIMIT 1;
		`;

		const [rows] = await conn.query(query, [userId]);
		return rows;
	} finally {
		conn.release();
	}
}

// get all tricks from allTricks table with the users information on each trick
export async function getAllTricksFromUsersPerspective(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	try {
		const { sessionToken } = await verifySessionToken(req, res);
		const userId = sessionToken.sub;
		const url_userId = req.params.userId;

		if (userId !== url_userId) {
			return res.status(401).json({ error: 'Not Authenticated' });
		}

		const query = `
			SELECT
				at.*,
				t.Id AS UserTrickId,
				t.UserId
				FROM
				AllTricks at
				LEFT JOIN
				Tricks t ON t.Name = at.Name AND t.UserId = ?
				ORDER BY
			at.Name ASC;
		`;

		const [rows] = await conn.query(query, [userId]);
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error: [getAllTricksFromUsersPerspective', error);
		return res.status(500).json({ error });
	} finally {
		if (conn) conn.release();
	}
}

// get all tricks from allTricks table with the users information on each trick (generalType)
export async function getAllTricksFromUsersPerspectiveByGeneralType(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	try {
		const { sessionToken } = await verifySessionToken(req, res);
		const userId = sessionToken.sub;
		const url_userId = req.params.userId;

		const generaltype = req.params.generaltype;

		if (userId !== url_userId) {
			return res.status(401).json({ error: 'Not Authenticated' });
		}

		const query = `
		SELECT
			at.*,
			t.Id AS UserTrickId,
			t.UserId
			FROM
			AllTricks at
			LEFT JOIN
			Tricks t ON t.Name = at.Name AND t.UserId = ?
			WHERE
			at.GeneralType = ?
			ORDER BY
		at.Name ASC;
		`;

		const [rows] = await conn.query(query, [userId, generaltype]);
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error: [getAllTricksFromUsersPerspective', error);
		return res.status(500).json({ error });
	} finally {
		if (conn) conn.release();
	}
}
