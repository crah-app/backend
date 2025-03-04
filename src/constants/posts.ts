import path from 'path';
import fs from 'fs';
import archiver, { Archiver } from 'archiver';
import { Request, Response } from "express";
import { Err, ErrType } from "./errors.js";
import DbConnection from "./dbConnection.js";
import { verifyJwt } from "./userAuth.js";
import { Trick, TrickDescription } from "../trickLogic/trick.js";
import { Spot } from "../trickLogic/spot.js";

function getPostDir(type: string): Err | string {
	switch(type) {
		case "Article": return process.env.DIR_ARTICLES!; // + <POST_ID>.md
		case "Video": return process.env.DIR_VIDEOS!; // + <POST_ID>.mp4
		case "Flash": return process.env.DIR_FLASHES!; // + <POST_ID>_<0..N>.<png/mp4>
		case "Music": return process.env.DIR_MUSIC!; // + <POST_ID>.mp3
		default: return { type: ErrType.InvalidPostType, message: "There isn't any post with this ID"};
	}
}

// https://www.npmjs.com/package/archiver

export async function getPost(req: Request, res: Response, db: DbConnection): Promise<Err | void> {

	const postId: any | undefined = req.query.postId;

	try {
		if (!postId) return {
			type: ErrType.RequestMissingProperty,
			message: "Post ID is required",
		};

		const postQuery = `SELECT * FROM Posts WHERE Posts.Id = ?`;
		const likesQuery = `SELECT * FROM Likes WHERE Likes.PostId = ?`;
		
		const post = await new Promise<any>((resolve, reject) => {
			db.query(postQuery, postId, (err: any, results: any) => {
				if (err) reject({
					type: ErrType.MySqlFailedQuery,
					message: err.code + "Database Query failed. Impossible to fetch the post",
				});
				resolve(results);
			});
		});
		
		const likes = await new Promise<any>((resolve, reject) => {
			db.query(likesQuery, postId, (err: any, results: any) => {
				if (err) reject({
					type: ErrType.MySqlFailedQuery,
					message: err.code + "Database Query failed. Impossible to fetch the posts' likes",
				});
				resolve(results);
			});
		});
		
		const DIR: Err | string = getPostDir(post[0].Type);
		
		// if DIR is error, propagate
		if(typeof DIR !== 'string') return DIR;
		
		let data = {
			"post": post,
			"likes": likes,
		};
		
		sendPostZipFile(res, postId, DIR, JSON.stringify(data));
	} catch (err) {
		return err as Err;
	}
}

function sendPostZipFile(res: Response, postId: number, dir: string, data: any) {
	const archive = archiver('zip', {
	  zlib: { level: 9 } // Sets the compression level.
	});
	
	archive.pipe(res);
	
	const cwd = process.cwd() + '/public' + dir;
	
	// appends the main files and the cover
	archive.glob(`${postId}*`, {cwd: cwd});
	
	archive.append(data, { name: 'metadata.json' });
	
	archive.finalize();
}
