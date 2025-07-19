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

		console.log(rows[0].rank);

		const old_rank = Rank.getRankIndexByName(rows[0].rank) ?? -1;

		console.log('old_rank', old_rank, 'new rank', rank);

		await conn.query(query, [rank + 1, points, userId]);

		return { old_rank, new_rank: rank };
	} catch (error) {
		console.warn('Error [setUserRank]', error);
		return { old_rank: -1, new_rank: -1 };
	} finally {
		if (conn) conn.release();
	}
}
