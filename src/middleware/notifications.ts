import { Request, Response } from 'express';
import { Err, ErrType } from './../constants/errors.js';
import DbConnection from './../constants/dbConnection.js';
import { verifySessionToken } from './auth.js';

// get notifications
export async function getUserNotifications(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	try {
		const { sessionToken } = await verifySessionToken(req, res);

		if (!sessionToken) return;

		const userId = sessionToken.sub;
		const notifications = await handleGetNotifications(db, userId);

		return res.status(200).json({ notifications });
	} catch (err) {
		console.warn('[getUserNotifications] Error:', err);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
}

export async function handleGetNotifications(db: DbConnection, userId: string) {
	// get unread notifications
	const query = `
    SELECT Id, UserId, SenderId, Type, PostId, Message, IsRead, CreatedAt
    FROM inboxNotifications
    WHERE UserId = ? AND IsRead = FALSE
    ORDER BY CreatedAt DESC;
  `;

	const conn = await db.connect();
	if (conn instanceof Err) return conn;

	try {
		const [rows] = await conn.query(query, [userId]);
		return rows;
	} catch (error) {
		console.warn('[handleGetNotifications] Error:', error);
		return error;
	} finally {
		conn.release();
	}
}

// read notifications
export async function readUserNotification(
	req: Request,
	res: Response,
	db: DbConnection,
) {}

export async function handleReadUserNotification(
	db: DbConnection,
	userId: string,
) {}
