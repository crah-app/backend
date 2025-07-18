import archiver from 'archiver';
import { Request, Response } from 'express';
import { Err } from './../constants/errors.js';
import DbConnection, { dbConnection } from './../constants/dbConnection.js';

import dotenv from 'dotenv';
import { sourceMetadataInterface } from '../types/index.js';
import {
	allPostsQuery,
	allPostsQueryByUserId,
	getPostByPostId,
} from '../dbQuerys/posts.js';
import { verifySessionToken } from './auth.js';
import { Comment } from '../types/userPost.js';
import { ResultSetHeader } from 'mysql2';
dotenv.config();

export async function getPostById(
	res: Response,
	req: Request,
	db: DbConnection,
): Promise<Err | void> {
	try {
		const postId = req.body.postId;
		const result = await getAllPostsHandler(db, null, postId);

		res.status(200).json(result);
	} catch (err) {
		console.warn('Error [getPostById]', err);
		res.status(500).json({ error: err });
		return err as Err;
	}
}

// get all posts by user id
export async function getAllPostsByUserId(
	res: Response,
	req: Request,
	db: DbConnection,
): Promise<Err | void> {
	try {
		const userId = req.params.userId;
		const result = await getAllPostsHandler(db, userId);

		res.status(200).json(result);
	} catch (err) {
		console.warn('Error [getAllPostsbyUserId]', err);
		res.status(500).json({ error: err });
		return err as Err;
	}
}

// get all posts
export async function getAllPostsHandler(
	db: DbConnection,
	userId: string | null = null,
	postId: number | null = null,
) {
	try {
		const query = userId
			? allPostsQueryByUserId
			: postId
			? getPostByPostId
			: allPostsQuery;

		const values = userId
			? [userId, userId]
			: postId
			? [userId, postId]
			: [userId];

		const conn = await db.connect();
		if (conn instanceof Err) return conn;

		const [rows] = await conn.execute(query, values);
		conn.release();

		return rows;
	} catch (err) {
		console.warn('Error [getAllPostsHandler]', err);
		return err as Err;
	}
}

export async function getAllPosts(
	res: Response,
	req: Request,
	db: DbConnection,
	url_userId: string | null = null,
	postId: number | null = null,
) {
	const { sessionToken } = await verifySessionToken(req, res);
	if (!sessionToken) return;

	try {
		const userId = sessionToken.sub;

		if (userId !== url_userId) {
			return res.status(401).json({ error: 'Not Authenticated' });
		}

		const result = await getAllPostsHandler(dbConnection, url_userId, postId);
		return res.status(200).json(result);
	} catch (err) {
		console.warn('Error [getAllPosts]', err);
		return res
			.status(500)
			.json({ error: 'Failed to load all posts', msg: err });
	}
}

// upload post metadata in db after post source files. (video, cover, ...) uploaded to the cloud
export async function uploadPost(
	req: Request,
	res: Response,
	metadata: sourceMetadataInterface,
	db: DbConnection,
	sourceKey: string,
	coverSourceKey: string,
) {
	const connOrErr = await db.connect();
	if (connOrErr instanceof Err) throw connOrErr;
	const conn = connOrErr;

	try {
		await conn.beginTransaction();

		// Step 1: Insert post
		const insertPostQuery = `
			INSERT INTO Posts (UserId, Type, Title, Description, CreatedAt, UpdatedAt, SourceKey, CoverSourceKey)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`;

		const [postResult]: any = await conn.execute(insertPostQuery, [
			metadata.userId,
			metadata.type,
			metadata.data.title,
			metadata.data.description,
			new Date(),
			new Date(),
			sourceKey,
			coverSourceKey,
		]);

		const postId = postResult.insertId;
		const tags = metadata.data.tags || [];

		// Step 2: Insert new tags (if needed)
		if (tags.length > 0) {
			const tagPlaceholders = tags.map(() => '(?)').join(',');
			const insertTagsQuery = `INSERT IGNORE INTO Tags (Name) VALUES ${tagPlaceholders}`;
			await conn.execute(insertTagsQuery, tags);
		}

		// Step 3: Link post with tags
		if (tags.length > 0) {
			const postTagValues = tags.flatMap((tag: any) => [postId, tag]);
			const postTagPlaceholders = tags.map(() => '(?, ?)').join(',');
			const insertPostTagsQuery = `INSERT INTO PostTags (PostId, TagName) VALUES ${postTagPlaceholders}`;
			await conn.execute(insertPostTagsQuery, postTagValues);
		}

		await conn.commit();
	} catch (err) {
		await conn.rollback();
		console.warn('Post upload failed:', err);
	} finally {
		conn.release();
	}
}

// modify like status of post
export async function setPostLikeStatus(
	res: Response,
	req: Request,
	db: DbConnection,
) {
	const connOrErr = await db.connect();
	if (connOrErr instanceof Err) throw connOrErr;
	const conn = connOrErr;

	try {
		const postId: number = Number(req.params.postId);
		const userId = req.params.userId;
		const likeStatus: boolean = req.body.currentUserLiked; // true : like , false : dislike

		const query = likeStatus
			? `
		  INSERT IGNORE INTO Likes (PostId, UserId)
		  VALUES (?, ?);
		`
			: `
		  DELETE FROM Likes
		  WHERE PostId = ? AND UserId = ?;
		`;

		const [rows] = await conn.query(query, [postId, userId]);

		res.json(rows);
	} catch (err) {
		console.warn('Failed modifying like status of post:', err);
	} finally {
		conn.release();
	}
}

// add comment
export async function setPostComment(
	res: Response,
	req: Request,
	db: DbConnection,
) {
	const connOrErr = await db.connect();
	if (connOrErr instanceof Err) throw connOrErr;
	const conn = connOrErr;

	try {
		const { sessionToken } = await verifySessionToken(req, res);
		if (!sessionToken) return;

		const url_userId = req.params.userId;
		const postId: number = Number(req.params.postId);
		const comment: Comment = req.body.comment;

		if (sessionToken.sub !== url_userId) {
			return res.status(401).json({ error: 'Not Authenticated' });
		}

		const query = `
		INSERT INTO Comments (PostId, UserId, Message)
		VALUES (?, ?, ?);
	  `;

		const [result] = await conn.query<ResultSetHeader>(query, [
			postId,
			url_userId,
			comment.Message,
		]);

		res.status(201).json({
			success: true,
			insertedId: result.insertId,
		});
	} catch (err) {
		console.warn('Error [setPostComment]:', err);
		return res
			.status(500)
			.json({ error: 'Post comment operation failed', msg: err });
	} finally {
		if (conn) conn.release();
	}
}

// get posts of all current-user`s friends
export async function getPostsOfFriends(
	res: Response,
	req: Request,
	db: DbConnection,
) {
	const conn = await dbConnection.connect();
	if (conn instanceof Err) throw conn;

	try {
		const { sessionToken } = await verifySessionToken(req, res);
		if (!sessionToken) return;

		const userId = sessionToken.sub;
		const url_userId = req.params.userId;

		if (userId !== url_userId) {
			return res.status(401).json({ error: 'Not Authenticated' });
		}

		const query = `
			SELECT
			p.*,
			IFNULL(likes_count, 0) AS likes_count,
			IFNULL(comments_count, 0) AS comments_count,
			IFNULL(shares_count, 0) AS shares_count
			FROM
			Posts p
			JOIN
			(
				SELECT
				CASE
					WHEN UserAId = ? THEN UserBId
					ELSE UserAId
				END AS FriendId
				FROM Friends
				WHERE UserAId = ? OR UserBId = ?
			) f ON p.UserId = f.FriendId
			LEFT JOIN
			(
				SELECT PostId, COUNT(*) AS likes_count
				FROM Likes
				GROUP BY PostId
			) l ON p.Id = l.PostId
			LEFT JOIN
			(
				SELECT PostId, COUNT(*) AS comments_count
				FROM Comments
				GROUP BY PostId
			) c ON p.Id = c.PostId
			LEFT JOIN
			(
				SELECT PostId, COUNT(*) AS shares_count
				FROM Shares
				GROUP BY PostId
			) s ON p.Id = s.PostId
			ORDER BY
			likes_count DESC,
			comments_count DESC,
			shares_count DESC,
			p.CreatedAt DESC
			LIMIT 50;
		`;

		const [rows] = await conn.query(query, [userId]);
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error: [getPostsOfFriends]', error);
		res.status(500).json({ error });
	} finally {
		if (conn) conn.release();
	}
}

// get posts from rank
export async function getPostsFromRank(
	req: Request,
	res: Response,
	db: DbConnection,
) {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	try {
		const rank = req.params.rank;

		const query = `
			SELECT
				p.*,
				IFNULL(likes_count, 0) AS likes_count,
				IFNULL(comments_count, 0) AS comments_count,
				IFNULL(shares_count, 0) AS shares_count
				FROM
				Posts p
				JOIN
				Users u ON p.UserId = u.Id
				LEFT JOIN
				(SELECT PostId, COUNT(*) AS likes_count FROM Likes GROUP BY PostId) l ON p.Id = l.PostId
				LEFT JOIN
				(SELECT PostId, COUNT(*) AS comments_count FROM Comments GROUP BY PostId) c ON p.Id = c.PostId
				LEFT JOIN
				(SELECT PostId, COUNT(*) AS shares_count FROM Shares GROUP BY PostId) s ON p.Id = s.PostId
				WHERE
				u.rank = ?
				ORDER BY
				likes_count DESC,
				comments_count DESC,
				shares_count DESC,
				p.CreatedAt DESC
			LIMIT 50;
		`;

		const [rows] = await conn.query(query, rank);
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error: [getPostsFromRank]', error);
		return res.status(500).json({ error });
	} finally {
		if (conn) conn.release();
	}
}

// get one post from rank
export async function getPostFromRank(
	res: Response,
	req: Request,
	db: DbConnection,
) {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	try {
		const rank = req.params.rank;
		const postId = req.params.postId;

		const query = `
		SELECT
		  p.*
		FROM
		  Posts p
		JOIN
		  Users u ON p.UserId = u.Id
		WHERE
		  u.rank = ? AND p.Id = ?
		ORDER BY
		  p.CreatedAt DESC
		LIMIT 50;
	  `;

		const [rows] = await conn.query(query, [rank, postId]);
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error: [getPostsFromRank]', error);
		return res.status(500).json({ error });
	} finally {
		if (conn) conn.release();
	}
}

export async function getCommentsOfPost(
	res: Response,
	req: Request,
	db: DbConnection,
) {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	try {
		const postId = req.params.postId;

		const query = `
			SELECT 
			c.Id,
			c.PostId,
			c.UserId,
			u.Name AS UserName,
			u.avatar AS UserAvatar,
			c.Message,
			c.CreatedAt,
			c.UpdatedAt,
			IFNULL(cl.likeCount, 0) AS likes
			FROM Comments c
			JOIN Users u ON u.Id = c.UserId
			LEFT JOIN (
			SELECT CommentId, COUNT(*) AS likeCount
			FROM CommentLikes
			GROUP BY CommentId
			) cl ON cl.CommentId = c.Id
			WHERE c.PostId = ?
			ORDER BY likes DESC, c.CreatedAt DESC;		
		`;

		const [rows] = await conn.query(query, [postId]);
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error [getCommentsPost]', error);
		return res
			.status(500)
			.json({ error: `Error requesting all comments of a post`, msg: error });
	} finally {
		if (conn) conn.release();
	}
}
