import { Request, Response } from 'express';
import { createClerkClient } from '@clerk/backend';
import { Err, ErrType } from '../constants/errors.js';
import DbConnection from './../constants/dbConnection.js';
import { Pool } from 'mysql2';

// export to /types
type UserSetting = 'setting01' | 'setting02';

const clerkClient = createClerkClient({
	secretKey: process.env.CLERK_SECRET_KEY,
});

export async function getAllUsers(res: Response) {
	// outputs a json with all users and their data
	const allUsers = await clerkClient.users.getUserList();

	res.json(allUsers.data);
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

		// sql query to get user information to display in profile
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

		// outputs a json with all users and their data
		// const userStats = await clerkClient.users.getUser(id);

		const [rows] = await conn.query(query, [id]);

		res.json(rows);
		conn.release();
	} catch (err) {
		res.json({ err: err });
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
