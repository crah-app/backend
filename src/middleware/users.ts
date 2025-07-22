import { Request, Response } from 'express';
import { createClerkClient } from '@clerk/backend';
import { Err, ErrType } from '../constants/errors.js';
import DbConnection from './../constants/dbConnection.js';
import { Pool } from 'mysql2';
import { verifySessionToken } from './auth.js';
import {
	handleGetBestTrickOfUser,
	handleGetBestTricksOfUser,
	handleGetOverallBestTricksOfUser,
} from './tricks.js';

// export to /types
type UserSetting = 'setting01' | 'setting02';

export async function getAllClerkUsers(res: Response) {
	const clerkClient = createClerkClient({
		secretKey: process.env.CLERK_SECRET_KEY,
		publishableKey: process.env.CLERK_PUBLIC_KEY,
	});

	// outputs a json with all users and their data
	const allUsers = await clerkClient.users.getUserList();

	res.json(allUsers.data);
}

export async function getAllUsers(
	res: Response,
	req: Request,
	db: DbConnection,
) {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	try {
		const query = `
		SELECT * FROM users
	`;

		const [rows] = await conn.query(query);
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error [getAllUsers]', error);
		res.status(500).json({ error });
	} finally {
		if (conn) conn.release();
	}
}

export async function getUserStats(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const id = req.params.userId;

	try {
		if (!id)
			return new Err(ErrType.RequestMissingProperty, 'User ID is required');

		const conn = await db.connect();
		if (conn instanceof Err) return conn;

		// sql query to get user information
		const query = `
			SELECT 
			u.*, 
			COUNT(p.Id) AS posts,
			(SELECT COUNT(*) FROM Friends f WHERE f.UserAId = u.Id OR f.UserBId = u.Id) AS friendCount,
			(SELECT COUNT(*) FROM Follows f WHERE f.FollowedId = u.Id) AS followerCount
			FROM users u
			LEFT JOIN posts p ON p.UserId = u.Id
			WHERE u.Id = ?
			GROUP BY u.Id;
		`;

		const bestTricks = await handleGetBestTricksOfUser(db, id);
		const bestTricksOverall = await handleGetOverallBestTricksOfUser(db, id);
		const bestTrick = await handleGetBestTrickOfUser(db, id);

		const [rows] = await conn.query(query, [id]);

		res.json([rows, [bestTricks.rows], bestTricksOverall.rows, bestTrick]);
		conn.release();
	} catch (err) {
		console.warn('[getUserstat] Error:', err);
		res.status(500).json({ err: 'Internal Server Error' });
	}
}

// user can alter clerk and crah specific information
// clerk data gets updated on the client directly and the clerk API triggers the /webhook/clerk route
// this function manages changes to crah specific user data in the db
export async function updateUser(
	req: Request,
	res: Response,
	db: DbConnection,
	data: JSON,
) {}

// client alters an account setting (privacy setting, general setting, ...)
export async function alterAccountSettings(
	req: Request,
	res: Response,
	db: DbConnection,
	setting: UserSetting,
) {
	switch (setting) {
		case 'setting01':
			alterSetting01(req, res, db, setting);
	}
}

// alter setting "xy"
export async function alterSetting01(
	req: Request,
	res: Response,
	db: DbConnection,
	setting: UserSetting,
) {}

// check wether username is already taken when current-user wants to update/initialize his username
export async function isUsernameDuplicate(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const username = req.params.userName;

	try {
		if (!username)
			return new Err(ErrType.RequestMissingProperty, 'Username is required');

		const conn = await db.connect();
		if (conn instanceof Err) return conn;

		const query = `
			SELECT Id FROM users where Name = ?
		`;

		const [rows] = await conn.query(query, [username]);

		res.status(200);
		res.json(rows);
		conn.release();
	} catch (err) {
		res.json({ err: err });
	}
}

// set rider type of user
export async function setRiderTypeOfUser(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const url_userId = req.params.userId;
	const riderType = req.body.riderType;

	const { sessionToken } = await verifySessionToken(req, res);

	if (!sessionToken) return;

	const userId = sessionToken.sub;

	if (userId !== url_userId) {
		return res.status(401).json({ error: 'Not Authenticated' });
	}

	const conn = await db.connect();
	if (conn instanceof Err) return conn;

	const query = `
		UPDATE users SET riderType = ? where Id = ?;
	`;

	try {
		conn.query(query, [riderType, userId]);
		res.status(202).json({ success: true });
	} catch (err) {
		res.status(404);
		res.json({ success: false, error: err });
		return err as Err;
	}
}

// get friends of user
export async function getFriendsOfUser(
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
			CASE
				WHEN UserAId = ? THEN UserBId
				ELSE UserAId
			END AS FriendId
			FROM Friends
		WHERE UserAId = ? OR UserBId = ?;
		`;

		const [rows] = await conn.query(query, [userId]);
		res.status(200).json({ success: true, rows });
	} catch (error) {
		console.warn('Error: [getFriendsOfUser]', error);
		res.status(500).json({ error });
	} finally {
		if (conn) conn.release();
	}
}
