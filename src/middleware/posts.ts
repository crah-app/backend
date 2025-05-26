import archiver from 'archiver';
import { Request, Response } from 'express';
import { Err, ErrType } from './../constants/errors.js';
import DbConnection from './../constants/dbConnection.js';

import dotenv from 'dotenv';
import { sourceMetadataInterface } from '../types/index.js';
dotenv.config();

// dummy data
// import posts from '../../dummy/JSON/posts.json' with { type: 'json' };

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

export async function getPost(
	req: Request,
	res: Response,
	db: DbConnection,
): Promise<Err | void> {
	const postId = req.params.postId;

	if (!postId) {
		return new Err(ErrType.RequestMissingProperty, 'Post ID is required');
	}

	const postQuery = `SELECT * FROM Posts WHERE Posts.Id = ?`;
	const likesQuery = `SELECT * FROM Likes WHERE Likes.PostId = ?`;

	try {
		// Verbindung holen
		const conn = await db.connect();
		if (conn instanceof Err) return conn;

		try {
			// Post abrufen
			const [postRows] = await conn.query(postQuery, [postId]);
			if (!postRows || (postRows as any[]).length === 0) {
				return new Err(
					ErrType.PostNotFound,
					`No post was found with the id: ${postId}`,
				);
			}

			// Likes abrufen
			const [likesRows] = await conn.query(likesQuery, [postId]);

			const DIR: Err | string = getPostDir((postRows as any)[0].Type);
			if (typeof DIR !== 'string') return DIR;

			const data = {
				post: postRows,
				likes: likesRows,
			};

			res.json(data);
		} finally {
			conn.release();
		}
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

		// const fileData = await getAllPostsFromDatabase(userId);

		// res.json(fileData);
		res.json({});
	} catch (err) {
		return err as Err;
	}
}

// async function getAllPostsFromDatabase(userId: string) {
// 	return posts.filter((post) => post.userId === userId);
// }

// get all posts
export async function getAllPosts(
	res: Response,
	req: Request,
	db: DbConnection,
) {
	try {
		const postQuery = `
  SELECT
	p.Id,
	p.UserId,
	p.Type,
	p.Title,
	p.Description,
	p.Content,
	p.CreatedAt,
	p.UpdatedAt,
	p.SourceKey,   -- neu: der Key in deiner R2-Bucket
	COALESCE(
	  JSON_ARRAYAGG(
		CASE WHEN c.Id IS NOT NULL THEN
		  JSON_OBJECT(
			'Id', c.Id,
			'UserId', c.UserId,
			'Message', c.Message,
			'CreatedAt', c.CreatedAt,
			'UpdatedAt', c.UpdatedAt
		  )
		END
	  )
	, JSON_ARRAY()
	) AS comments
  FROM Posts p
  LEFT JOIN Comments c
	ON c.PostId = p.Id
  GROUP BY
	p.Id, p.UserId, p.Type, p.Title, p.Description, p.Content,
	p.CreatedAt, p.UpdatedAt, p.SourceKey
  ORDER BY p.CreatedAt DESC;
	  `;

		const conn = await db.connect();
		if (conn instanceof Err) return conn;

		const [rows]: any = await conn.query(postQuery);
		conn.release();

		// Erzeuge die vollständige Bucket-URL
		const base = process.env.CLOUDFLARE_BUCKET_URL;
		// z. B. "https://pub-78edb5b6f0d946d28db91b59ddf775af.r2.dev"

		const postsWithUrl = (rows as any[]).map((post) => ({
			Id: post.Id,
			UserId: post.UserId,
			Type: post.Type,
			Title: post.Title,
			Description: post.Description,
			Content: post.Content,
			CreatedAt: post.CreatedAt,
			UpdatedAt: post.UpdatedAt,
			comments: post.comments,
			// neu:
			mediaUrl: `https://pub-78edb5b6f0d946d28db91b59ddf775af.r2.dev/${post.SourceKey}`,
		}));

		res.json(postsWithUrl);
	} catch (err) {
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
) {
	const connOrErr = await db.connect();
	if (connOrErr instanceof Err) throw connOrErr;
	const conn = connOrErr;

	console.log(metadata);

	try {
		await conn.beginTransaction();

		// Step 1: Insert post
		const insertPostQuery = `
			INSERT INTO Posts (UserId, Type, Title, Description, CreatedAt, UpdatedAt, SourceKey)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`;

		const [postResult]: any = await conn.execute(insertPostQuery, [
			metadata.userId,
			metadata.type,
			metadata.data.title,
			metadata.data.description,
			new Date(),
			new Date(),
			sourceKey,
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
		res.status(200).json({ success: true, postId });
	} catch (err) {
		await conn.rollback();
		console.error('Post upload failed:', err);
		res.status(500).json({ error: 'Failed to upload post' });
	} finally {
		conn.release();
	}
}
