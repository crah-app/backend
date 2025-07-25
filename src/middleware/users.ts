import { Request, Response } from 'express';
import { createClerkClient } from '@clerk/backend';
import { Err, ErrType } from '../constants/errors.js';
import DbConnection from './../constants/dbConnection.js';
import { verifySessionToken } from './auth.js';
import {
	handleGetBestTrickOfUser,
	handleGetBestTricksOfUser,
	handleGetOverallBestTricksOfUser,
} from './tricks.js';
import { ranks } from '../types/index.js';
import { randomUUID } from 'crypto';

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

// get users of a specific rank
export async function getRidersOfSpecificRank(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	try {
		const rank = req.params.rank;
		const currentIndex = ranks.indexOf(rank);

		if (currentIndex === -1) {
			return res.status(400).json({ error: 'Invalid rank' });
		}

		const nextRank = ranks[currentIndex + 1] || null;

		const limit = Number(req.params.limit);
		const offset = Number(req.params.offset);

		const query = `
SELECT 
  u.*,
  ROW_NUMBER() OVER (
    PARTITION BY u.\`rank\`
    ORDER BY u.rankPoints DESC
  ) AS rankIndex,
  bestTrick.Id AS TrickId,   
  bestTrick.Name AS TrickName,
  bestTrick.Points AS TrickPoints,
  bestTrick.Difficulty AS TrickDifficulty,
  bestTrick.Spot AS TrickSpot,
  bestTrick.Date AS TrickDate
FROM Users u
LEFT JOIN (
  SELECT 
    t.Id,
    t.UserId,
    t.Name,
    gs.Points,
    gs.Difficulty,
    gs.Spot,
    gs.Date
  FROM Tricks t
  JOIN GeneralSpots gs ON t.Id = gs.TrickId
  JOIN (
    SELECT t.UserId, MAX(gs.Points) AS MaxPoints
    FROM Tricks t
    JOIN GeneralSpots gs ON t.Id = gs.TrickId
    GROUP BY t.UserId
  ) best ON best.UserId = t.UserId AND best.MaxPoints = gs.Points
) bestTrick ON u.Id = bestTrick.UserId
WHERE u.\`rank\` = ?
ORDER BY u.rankPoints DESC
LIMIT ? OFFSET ?;
		`;

		const [rows] = await conn.query(query, [rank, limit, offset]);
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error: [getRidersOfSpecificRank]', error);
		res.status(500).json({ error });
	} finally {
		conn && conn.release();
	}
}

// search for ranked user in db
export async function searchRankedUser(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	const searchQuery = req.query.q as string | undefined;

	const limit = Number(req.params.limit);
	const offset = Number(req.params.offset);

	if (!searchQuery || searchQuery.trim().length === 0) {
		res.status(400).json({ error: 'Missing search query' });
		return;
	}

	try {
		const query = `
		SELECT 
		u.*,
        ROW_NUMBER() OVER (
      PARTITION BY u.\`rank\`
      ORDER BY u.rankPoints DESC
    ) AS rankIndex,
	bestTrick.Id AS TrickId,   
	bestTrick.Name AS TrickName,
	bestTrick.Points AS TrickPoints,
	bestTrick.Difficulty AS TrickDifficulty,
	bestTrick.Spot AS TrickSpot,
	bestTrick.Date AS TrickDate
		FROM Users u
		LEFT JOIN (
		  SELECT 
			t.Id,
			t.UserId,
			t.Name,
			gs.Points,
			gs.Difficulty,
			gs.Spot,
			gs.Date
		  FROM Tricks t
		  JOIN GeneralSpots gs ON t.Id = gs.TrickId
		  JOIN (
			SELECT t.UserId, MAX(gs.Points) AS MaxPoints
			FROM Tricks t
			JOIN GeneralSpots gs ON t.Id = gs.TrickId
			GROUP BY t.UserId
		  ) best ON best.UserId = t.UserId AND best.MaxPoints = gs.Points
		) bestTrick ON u.Id = bestTrick.UserId
		WHERE u.Name = ?
		LIMIT ? OFFSET ?
	  `;

		const [rows] = await conn.query(query, [searchQuery, limit, offset]);
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error [searchRankedUser]', error);
		res.status(500).json({ error });
	} finally {
		conn.release();
	}
}

// get global leaderboard
export async function getGlobalLeaderboard(
	res: Response,
	req: Request,
	db: DbConnection,
) {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	const limit = Number(req.params.limit);
	const offset = Number(req.params.offset);

	try {
		const query = `
		SELECT 
		u.*,
        ROW_NUMBER() OVER (
      ORDER BY u.rankPoints DESC
    ) AS rankIndex,
	bestTrick.Id AS TrickId,   
	bestTrick.Name AS TrickName,
	bestTrick.Points AS TrickPoints,
	bestTrick.Difficulty AS TrickDifficulty,
	bestTrick.Spot AS TrickSpot,
	bestTrick.Date AS TrickDate
		FROM Users u
		LEFT JOIN (
		  SELECT 
			t.Id,
			t.UserId,
			t.Name,
			gs.Points,
			gs.Difficulty,
			gs.Spot,
			gs.Date
		  FROM Tricks t
		  JOIN GeneralSpots gs ON t.Id = gs.TrickId
		  JOIN (
			SELECT t.UserId, MAX(gs.Points) AS MaxPoints
			FROM Tricks t
			JOIN GeneralSpots gs ON t.Id = gs.TrickId
			GROUP BY t.UserId
		  ) best ON best.UserId = t.UserId AND best.MaxPoints = gs.Points
		) bestTrick ON u.Id = bestTrick.UserId
		LIMIT ? OFFSET ?
	  `;

		const [rows] = await conn.query(query, [limit, offset]);
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error [getGloablLeaderboard]', error);
		res.status(500).json({ error });
	} finally {
		conn.release();
	}
}

// get detailed rank insides of user regional and global
export async function getAllRankStatsOfUser(
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

		const query = `
SELECT 
  u.*,
  ROW_NUMBER() OVER (ORDER BY u.rankPoints DESC) AS rankGlobalIndex,
  ROUND(
    100 * (totalUsers.total - ROW_NUMBER() OVER (ORDER BY u.rankPoints DESC) + 1) / totalUsers.total,
    2
  ) AS rankGlobalRelative,

  ROW_NUMBER() OVER (PARTITION BY u.country ORDER BY u.rankPoints DESC) AS rankRegionalIndex,
  ROUND(
    100 * (regionalUsers.totalRegional - ROW_NUMBER() OVER (PARTITION BY u.country ORDER BY u.rankPoints DESC) + 1) / regionalUsers.totalRegional,
    2
  ) AS rankRegionalRelative,

  bestTrick.Id AS TrickId,   
  bestTrick.Name AS TrickName,
  bestTrick.Points AS TrickPoints,
  bestTrick.Difficulty AS TrickDifficulty,
  bestTrick.Spot AS TrickSpot,
  bestTrick.Date AS TrickDate

FROM 
  Users u

JOIN 
  (SELECT COUNT(*) AS total FROM Users) totalUsers

JOIN 
  (SELECT country, COUNT(*) AS totalRegional FROM Users GROUP BY country) regionalUsers 
  ON u.country = regionalUsers.country

LEFT JOIN (
  SELECT 
    t.Id,
    t.UserId,
    t.Name,
    gs.Points,
    gs.Difficulty,
    gs.Spot,
    gs.Date
  FROM Tricks t
  JOIN GeneralSpots gs ON t.Id = gs.TrickId
  JOIN (
    SELECT t.UserId, MAX(gs.Points) AS MaxPoints
    FROM Tricks t
    JOIN GeneralSpots gs ON t.Id = gs.TrickId
    GROUP BY t.UserId
  ) best ON best.UserId = t.UserId AND best.MaxPoints = gs.Points
) bestTrick ON u.Id = bestTrick.UserId

WHERE u.Id = ?
LIMIT 1;
		`;

		const [rows] = await conn.query(query, [userId]);
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error [getAllRankStatsOfUser]', error);
		res.status(500).json({ error });
	} finally {
		conn.release();
	}
}

// set region and country
export async function setRegionOfUser(
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
		const { region, country, userId_body } = req.body;

		if (!region || !country) {
			return res
				.status(400)
				.json({ error: 'region or country missing in body' });
		}

		if (region.length > 105 || country.length > 105) {
			return res.status(400).json({ error: 'region or country too long' });
		}

		if (userId_body !== userId) {
			return res.status(401).json({ error: 'Not Authenticated' });
		}

		const query = `
		UPDATE Users
		SET region = ?, country = ?
		WHERE Id = ?
		`;

		const [rows]: any = await conn.query(query, [userId, region, country]);

		if (rows.affectedRows === 0) {
			return res.status(404).json({ error: 'User not found' });
		}

		res.status(200).json({ success: true });
	} catch (error) {
		console.warn('Error [setRegionOfUser]', error);
		res.status(500).json({ error, success: false });
	} finally {
		conn.release();
	}
}

// user gives feedback
export async function giveFeedback(
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
		const { userId: userId_body, feedback } = req.body;

		if (userId_body !== userId) {
			return res.status(401).json({ error: 'Not Authenticated' });
		}

		const query = `
			INSERT INTO Feedback (Id, UserId, Message)
			VALUES (?, ?, ?);
		`;

		await conn.query(query, [randomUUID(), userId, feedback]);

		res.status(200).json({ success: true });
	} catch (error) {
		console.warn('Error [giveFeedback]', error);
		res.status(500).json({ error, success: false });
	} finally {
		conn.release();
	}
}
