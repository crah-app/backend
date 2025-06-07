import archiver from 'archiver';
import { Request, Response } from 'express';
import { Err, ErrType } from './../constants/errors.js';
import DbConnection from './../constants/dbConnection.js';

import dotenv from 'dotenv';
import { sourceMetadataInterface } from '../types/index.js';
import {
	allPostsQuery,
	allPostsQueryByUserId,
	getPostByPostId,
} from '../dbQuerys/posts.js';
dotenv.config();

export async function getPostById(
	res: Response,
	req: Request,
	db: DbConnection,
): Promise<Err | void> {
	try {
		const postId = req.body.postId;

		const result = await getAllPosts(res, req, db, null, postId);
	} catch (err) {
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

		const result = await getAllPosts(res, req, db, userId);

		res.json(result);
	} catch (err) {
		return err as Err;
	}
}

// get all posts
export async function getAllPosts(
	res: Response,
	req: Request,
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

		const conn = await db.connect();
		if (conn instanceof Err) return conn;

		const [rows] = await conn.execute(query, [
			userId ? userId : postId ? postId : null,
		]);

		conn.release();

		res.json(rows);
		return rows;
	} catch (err) {
		res.status(500).json({ error: 'Failed to load all posts', msg: err });
		return err as Err;
	}
}

// get post with filter options

// get all posts from a specific rank
// export async function getAllPostsFromRank(res:Response, req: Request, db : DbConnection) {
// 	res.json(posts);
// };

// // get one post from a specific rank
// export async function getPostFromRank(res:Response, req: Request, db : DbConnection) {
// 	res.json(posts);
// };

// // get all posts from all friends by one client
// export async function getAllPostsFromFriends(res:Response, req: Request, db : DbConnection) {
// 	res.json(posts);
// };

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
		const likeStatus: boolean = req.body.userLikedPost;

		const query = `
			
		`;

		const [rows] = await conn.query(query, [postId]);

		res.json(rows);
	} catch (err) {
		console.warn('Failed modifying like status of post:', err);
	} finally {
		conn.release();
	}
}
