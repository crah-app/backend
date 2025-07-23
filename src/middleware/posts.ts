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
			: [userId, userId];

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
		const userId = req.params.userId;

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
			IFNULL(cl.likeCount, 0) AS likes,
			EXISTS (
				SELECT 1
				FROM CommentLikes cl2
				WHERE cl2.CommentId = c.Id AND cl2.UserId = ?
			) AS liked
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

		const [rows] = await conn.query(query, [userId, postId]);
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

// user likes/dislikes a comment
export async function setCommentLike(
	res: Response,
	req: Request,
	db: DbConnection,
) {
	try {
		const { sessionToken } = await verifySessionToken(req, res);
		if (!sessionToken) return;

		const userId = sessionToken.sub;
		const url_userId = req.params.userId;
		const postId = req.params.postId;
		const commentId = req.params.commentId;
		const { like } = req.body;

		if (userId !== url_userId) {
			return res.status(401).json({ error: 'Not Authenticated' });
		}

		const conn = await db.connect();
		if (conn instanceof Err) throw conn;

		const query = like
			? `
		INSERT IGNORE INTO CommentLikes (CommentId, UserId) VALUES (?, ?)
		`
			: `
		DELETE FROM CommentLikes WHERE CommentId = ? AND UserId = ?
		`;

		const [rows] = await conn.query(query, [commentId, userId]);

		conn.release();
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error [setCommentLike]', error);
		return res
			.status(500)
			.json({ error: 'Error modifying like status of comment', msg: error });
	}
}

// get most popular posts of the last 90 days
export async function getPopularPosts(
	res: Response,
	req: Request,
	db: DbConnection,
) {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	try {
		const { sessionToken } = await verifySessionToken(req, res);
		if (!sessionToken) return;

		const offset = Number(req.params.offset);
		const limit = Number(req.params.limit);
		const url_userId = req.params.userId;

		if (sessionToken.sub !== url_userId) {
			return res.status(401).json({ error: 'Not Authenticated' });
		}

		const userId = sessionToken.sub;

		// query to get the most popular posts of the last timeframe
		const query = `
		SELECT 
		p.Id,
		p.UserId,
		u.Name AS UserName,
		u.avatar AS UserAvatar,
		p.Type,
		p.Title,
		p.Description,
		p.Content,
		p.CreatedAt,
		p.UpdatedAt,
		p.SourceKey,
		IFNULL(l.likesCount, 0) AS likes,
		IFNULL(s.sharesCount, 0) AS shares,
		IFNULL(c.comments, JSON_ARRAY()) AS comments,
		IFNULL(total_c.totalComments, 0) AS totalComments,

		MAX(e.width) AS sourceWidth,
		MAX(e.height) AS sourceHeight,
		MAX(e.sourceRatio) AS sourceRatio,
		GROUP_CONCAT(DISTINCT r.EmojiId) AS Reactions,

		EXISTS(SELECT 1 FROM Likes l2 WHERE l2.PostId = p.Id AND l2.UserId = ?) AS liked,

		(
			IFNULL(l.likesCount, 0) * 1 +
			COUNT(DISTINCT c2.Id) * 2 +
			IFNULL(s.sharesCount, 0) * 3 +
			COUNT(DISTINCT r.Id) * 1
		) AS PopularityScore

		FROM 
		posts p
		JOIN Users u ON u.Id = p.UserId
		LEFT JOIN Comments c2 ON c2.PostId = p.Id
		LEFT JOIN Reactions r ON r.PostId = p.Id AND r.isDeleted = 0
		LEFT JOIN Sources e ON e.\`key\` = p.SourceKey
		LEFT JOIN (
		SELECT PostId, COUNT(*) AS likesCount FROM Likes GROUP BY PostId
		) l ON l.PostId = p.Id
		LEFT JOIN (
		SELECT PostId, COUNT(*) AS sharesCount FROM Shares GROUP BY PostId
		) s ON s.PostId = p.Id
		LEFT JOIN (
		SELECT 
			ranked.PostId,
			JSON_ARRAYAGG(
			JSON_OBJECT(
				'Id', ranked.Id,
				'UserId', ranked.UserId,
				'UserName', ranked.UserName,
				'UserAvatar', ranked.UserAvatar,
				'Message', ranked.Message,
				'CreatedAt', ranked.CreatedAt,
				'UpdatedAt', ranked.UpdatedAt,
				'likes', IFNULL(ranked.likeCount, 0),
				'liked', ranked.liked
			)
			) AS comments
		FROM (
			SELECT 
			c.*,
			u.Name AS UserName,
			u.avatar AS UserAvatar,
			IFNULL(cl.likeCount, 0) AS likeCount,
			EXISTS (
				SELECT 1 FROM CommentLikes cl2 WHERE cl2.CommentId = c.Id AND cl2.UserId = ?
			) AS liked,
			ROW_NUMBER() OVER (PARTITION BY c.PostId ORDER BY IFNULL(cl.likeCount, 0) DESC) AS rn
			FROM Comments c
			JOIN Users u ON u.Id = c.UserId
			LEFT JOIN (
			SELECT CommentId, COUNT(*) AS likeCount
			FROM CommentLikes
			GROUP BY CommentId
			) cl ON cl.CommentId = c.Id
		) ranked
		WHERE ranked.rn <= 2
		GROUP BY ranked.PostId
		) c ON c.PostId = p.Id

		LEFT JOIN (
			SELECT PostId, COUNT(*) AS totalComments
			FROM Comments
			GROUP BY PostId
		) total_c ON total_c.PostId = p.Id

		WHERE p.CreatedAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
		GROUP BY p.Id

		ORDER BY PopularityScore DESC, p.CreatedAt DESC
		LIMIT ? OFFSET ?;
		`;

		const [rows] = await conn.query(query, [userId, userId, limit, offset]);
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error [getPopularPosts]', error);
		res.status(500).json({
			error: 'Something went wrong getting the most popular posts',
			msg: error,
		});
	} finally {
		if (conn) conn.release();
	}
}

// get lately videos
export async function getLatelyPostsBySpecificPostType(
	res: Response,
	req: Request,
	db: DbConnection,
) {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	try {
		const { sessionToken } = await verifySessionToken(req, res);
		if (!sessionToken) return;

		const offset = Number(req.params.offset);
		const limit = Number(req.params.limit);
		const url_userId = req.params.userId;
		const postType = req.params.postType;

		if (url_userId !== sessionToken.sub) {
			return res.status(401).json({ error: 'Not Authenticated' });
		}

		const query = `
		SELECT 
		p.Id,
		p.UserId,
		u.Name AS UserName,
		u.avatar AS UserAvatar,
		p.Type,
		p.Title,
		p.Description,
		p.Content,
		p.CreatedAt,
		p.UpdatedAt,
		p.SourceKey,
		IFNULL(l.likesCount, 0) AS likes,
		IFNULL(s.sharesCount, 0) AS shares,
		IFNULL(c.comments, JSON_ARRAY()) AS comments,
		IFNULL(total_c.totalComments, 0) AS totalComments,

		MAX(e.width) AS sourceWidth,
		MAX(e.height) AS sourceHeight,
		MAX(e.sourceRatio) AS sourceRatio,
		GROUP_CONCAT(DISTINCT r.EmojiId) AS Reactions,

		EXISTS(SELECT 1 FROM Likes l2 WHERE l2.PostId = p.Id AND l2.UserId = ?) AS liked,

		(
			IFNULL(l.likesCount, 0) * 1 +
			COUNT(DISTINCT c2.Id) * 2 +
			IFNULL(s.sharesCount, 0) * 3 +
			COUNT(DISTINCT r.Id) * 1
		) AS PopularityScore

		FROM 
		posts p
		JOIN Users u ON u.Id = p.UserId
		LEFT JOIN Comments c2 ON c2.PostId = p.Id
		LEFT JOIN Reactions r ON r.PostId = p.Id AND r.isDeleted = 0
		LEFT JOIN Sources e ON e.\`key\` = p.SourceKey
		LEFT JOIN (
		SELECT PostId, COUNT(*) AS likesCount FROM Likes GROUP BY PostId
		) l ON l.PostId = p.Id
		LEFT JOIN (
		SELECT PostId, COUNT(*) AS sharesCount FROM Shares GROUP BY PostId
		) s ON s.PostId = p.Id
		LEFT JOIN (
		SELECT 
			ranked.PostId,
			JSON_ARRAYAGG(
			JSON_OBJECT(
				'Id', ranked.Id,
				'UserId', ranked.UserId,
				'UserName', ranked.UserName,
				'UserAvatar', ranked.UserAvatar,
				'Message', ranked.Message,
				'CreatedAt', ranked.CreatedAt,
				'UpdatedAt', ranked.UpdatedAt,
				'likes', IFNULL(ranked.likeCount, 0),
				'liked', ranked.liked
			)
			) AS comments
		FROM (
			SELECT 
			c.*,
			u.Name AS UserName,
			u.avatar AS UserAvatar,
			IFNULL(cl.likeCount, 0) AS likeCount,
			EXISTS (
				SELECT 1 FROM CommentLikes cl2 WHERE cl2.CommentId = c.Id AND cl2.UserId = ?
			) AS liked,
			ROW_NUMBER() OVER (PARTITION BY c.PostId ORDER BY IFNULL(cl.likeCount, 0) DESC) AS rn
			FROM Comments c
			JOIN Users u ON u.Id = c.UserId
			LEFT JOIN (
			SELECT CommentId, COUNT(*) AS likeCount
			FROM CommentLikes
			GROUP BY CommentId
			) cl ON cl.CommentId = c.Id
		) ranked
		WHERE ranked.rn <= 2
		GROUP BY ranked.PostId
		) c ON c.PostId = p.Id

		LEFT JOIN (
			SELECT PostId, COUNT(*) AS totalComments
			FROM Comments
			GROUP BY PostId
		) total_c ON total_c.PostId = p.Id

		WHERE p.CreatedAt >= DATE_SUB(NOW(), INTERVAL 90 DAY) AND p.Type = ?
		GROUP BY p.Id

		ORDER BY PopularityScore DESC, p.CreatedAt DESC
		LIMIT ? OFFSET ?;
		`;

		const [rows] = await conn.query(query, [
			url_userId,
			url_userId,
			postType,
			limit,
			offset,
		]);
		res.status(200).json(rows);
	} catch (error) {
		console.warn('Error [getLatelyVideos]', error);
		res.status(500).json({ error });
	} finally {
		conn && conn.release();
	}
}

// current user sets reaction to post
export async function setReaction(
	res: Response,
	req: Request,
	db: DbConnection,
) {
	const conn = await db.connect();
	if (conn instanceof Err) throw conn;

	try {
		const { sessionToken } = await verifySessionToken(req, res);
		if (!sessionToken) return;

		const userId = sessionToken.sub;
		const { postId, emojiId } = req.body;

		if (!postId || !emojiId) {
			return res.status(400).json({ error: 'Missing postId or emojiId' });
		}

		const postId_nbr = Number(postId);

		if (isNaN(postId_nbr)) {
			return res.status(400).json({ error: 'Invalid postId' });
		}

		const query = `
		INSERT INTO Reactions (PostId, UserId, EmojiId, IsDeleted)
		VALUES (?, ?, ?, FALSE)
		ON DUPLICATE KEY UPDATE IsDeleted = IF(IsDeleted = FALSE, TRUE, FALSE);
		`;

		await conn.query(query, [postId_nbr, userId, emojiId]);
		res.status(200).json({ success: true });
	} catch (error) {
		console.warn('Error [setReaction]', error);
		res
			.status(500)
			.json({ error: 'Something went wrong [setReaction]', message: error });
	} finally {
		conn && conn.release();
	}
}
