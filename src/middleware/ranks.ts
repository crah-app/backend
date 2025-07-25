import DbConnection from '../constants/dbConnection.js';
import { Response, Request } from 'express';
import { Err } from '../constants/errors.js';
import { verifySessionToken } from './auth.js';
import { Rank } from '../trickLogic/rank.js';
import { QueryResult, RowDataPacket } from 'mysql2';

// get rank of user
export async function getUserRank(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const userId = req.params.userId;

	try {
		const rows = await handleGetUserRank(userId, db);

		res.status(500).json({ success: true, error: null, result: rows });
	} catch (error) {
		res.status(500).json({ success: false, error });
	}
}

// handler
export async function handleGetUserRank(userId: string, db: DbConnection) {
	const connOrErr = await db.connect();
	if (connOrErr instanceof Err) throw connOrErr;
	const conn = connOrErr;

	const query = `
        SELECT users.rank FROM users where Id = ?
    `;

	const [rows] = await conn.query(query, [userId]);

	return rows;
}

// post rank of user
export async function postUserRank(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const userId = req.params.userId;
	const points = req.body.points;

	const { sessionToken } = await verifySessionToken(req, res);

	if (sessionToken.sub !== userId) {
		res
			.status(401)
			.json({ success: false, error: 'Not authenticated', result: null });
	}

	try {
		const result = await setUserRank(userId, points, db);

		res.status(500).json({ success: true, error: null, result });
	} catch (error) {
		res.status(500).json({ success: false, error });
	}
}

// set rank of user
export async function setUserRank(
	userId: string,
	points: number,
	db: DbConnection,
	totalPoints?: number,
) {
	const connOrErr = await db.connect();
	if (connOrErr instanceof Err) throw connOrErr;
	const conn = connOrErr;

	try {
		const rank = Rank.getRank(points);

		const query = `
        UPDATE users SET \`rank\` = ?, rankPoints = ?
        WHERE Id = ?
    `;

		const [rows] = await conn.query<RowDataPacket[]>(
			`SELECT users.rank FROM users where id = ?`,
			[userId],
		);

		const old_rank = Rank.getRankIndexByName(rows[0].rank) ?? -1;
		// console.log('old_rank', old_rank, 'new rank', rank);

		await conn.query(query, [rank + 1, points, userId]);

		const result = await insertIntoRankOvertime(
			db,
			userId,
			rank,
			points,
			totalPoints ?? -1,
		);

		return { old_rank, new_rank: rank };
	} catch (error) {
		console.warn('Error [setUserRank]', error);
		return { old_rank: -1, new_rank: -1 };
	} finally {
		if (conn) conn.release();
	}
}

// insert rank overtime
export async function insertIntoRankOvertime(
	db: DbConnection,
	userId: string,
	rank: Rank,
	RankPoints: number,
	RankTotalPoints: number,
): Promise<0 | 1> {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	try {
		const query = `
			INSERT INTO RankOvertime (UserId, \`rank\`, rankPoints, rankTotalPoints)
			VALUES (?, ?, ?, ?);
		`;

		const [rows] = await conn.query(query, [
			userId,
			rank,
			RankPoints,
			RankTotalPoints,
		]);
		return 0;
	} catch (error) {
		console.warn('Error [insertIntoRankOvertime]', error);
		return 1;
	} finally {
		conn && conn.release();
	}
}

// get rank overtime
export async function getRankOvertime(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	try {
		const { sessionToken } = await verifySessionToken(req, res);
		if (!sessionToken) return;

		const userId = sessionToken.sub;
		const { interval } = req.params;

		if (!interval) {
			return res.status(400).json({
				error: `Parameter Interval: string <"Month" | "Year"> is missing`,
			});
		}

		const query =
			interval === 'Month'
				? `
			SELECT * 
			FROM RankOvertime 
			WHERE UserId = ?
			AND CreatedAt >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
			ORDER BY CreatedAt ASC;
				`
				: `
			SELECT * 
			FROM RankOvertime 
			WHERE UserId = ?
			AND CreatedAt >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
			ORDER BY CreatedAt ASC;`;

		const [rows] = await conn.query(query, [userId]);
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error [insertIntoRankOvertime]', error);
		res.status(500).json({ error });
	} finally {
		conn && conn.release();
	}
}
