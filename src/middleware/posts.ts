import archiver from 'archiver';
import { Request, Response } from 'express';
import { Err, ErrType } from './../constants/errors.js';
import DbConnection from './../constants/dbConnection.js';

import path from 'path';
import { promises as fs } from 'fs';

import dotenv from 'dotenv';
dotenv.config();

// dummy data
import posts from '../../dummy/JSON/posts.json' with { type: 'json' }; // ← nur für native ESM nötig (nicht mit ts-node!)

// const typedPosts = posts as Post[];

function getPostDir(type: string): Err | string {
	switch (type) {
		case 'Article':
			return process.env.DIR_ARTICLES!;
		case 'Video':
			return process.env.DIR_VIDEOS!;
		case 'Flash':
			return process.env.DIR_FLASHES!;
		case 'Music':
			return process.env.DIR_MUSIC!;
		default:
			return new Err(
				ErrType.InvalidPostType,
				"There isn't any post with this ID",
			);
	}
}

// get post by id
export async function getPost(
	req: Request,
	res: Response,
	db: DbConnection,
): Promise<Err | void> {
	const postId: any | undefined = req.params.postId;

	try {
		if (!postId)
			return new Err(ErrType.RequestMissingProperty, 'Post ID is required');

		const postQuery = `SELECT * FROM Posts WHERE Posts.Id = ?`;
		const likesQuery = `SELECT * FROM Likes WHERE Likes.PostId = ?`;

		const conn = await db.connect();
		if (conn instanceof Err) return conn;

		const post = await new Promise<any>((resolve, reject) => {
			conn.query(postQuery, postId, (err: any, results: any) => {
				if (err) {
					conn.release();
					reject(new Err(ErrType.MySqlFailedQuery, err));
					return;
				}
				resolve(results);
			});
		});

		if (!post[0])
			return new Err(
				ErrType.PostNotFound,
				'No post was found with the id: ' + postId,
			);

		const likes = await new Promise((resolve, reject) => {
			conn.query(likesQuery, postId, (err: any, results: any) => {
				conn.release();
				if (err) {
					reject(
						new Err(
							ErrType.MySqlFailedQuery,
							err.code + 'Database Query failed. Impossible to fetch the likes',
						),
					);
					return;
				}
				resolve(results);
			});
		});

		const DIR: Err | string = getPostDir(post[0].Type);

		// if DIR is error, propagate
		if (typeof DIR !== 'string') return DIR;

		let data = {
			post: post,
			likes: likes,
		};

		// sendPostZipFile(res, postId, DIR as string, JSON.stringify(data));
		res.json(data);
	} catch (err) {
		return err as Err;
	}
}

// send post data as downloadable .zip file
function sendPostZipFile(
	res: Response,
	postId: number,
	dir: string,
	data: any,
) {
	const archive = archiver('zip', {
		zlib: { level: 9 }, // Sets the compression level.
	});

	archive.pipe(res);

	const cwd = process.cwd() + '/public' + dir;

	// appends the main files and the cover
	archive.glob(`${postId}*`, { cwd: cwd });

	archive.append(data, { name: 'metadata.json' });

	archive.finalize();
}

// get all posts by user id
export async function getAllPostsByUserId(
	res: Response,
	req: Request,
	db: DbConnection,
): Promise<Err | void> {
	try {
		const userId = req.params.userId;
		// get dummy data
		// @beheadedben please work on this code so this function actually fetches from the database and not from my dummy data

		const fileData = await getAllPostsFromDatabase(userId);

		res.json(fileData);
	} catch (err) {
		return err as Err;
	}
}

async function getAllPostsFromDatabase(userId: string) {
	return posts.filter((post) => post.userId === userId);
}


// get all posts 
export async function getAllPosts(res:Response, req: Request, db : DbConnection) {
	res.json(posts);
};

// get all posts from a specific rank
export async function getAllPostsFromRank(res:Response, req: Request, db : DbConnection) {
	res.json(posts);
};

// get one post from a specific rank
export async function getPostFromRank(res:Response, req: Request, db : DbConnection) {
	res.json(posts);
};

// get all posts from all friends by one client
export async function getAllPostsFromFriends(res:Response, req: Request, db : DbConnection) {
	res.json(posts);
};

