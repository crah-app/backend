import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2/promise';
import { verifyJwt } from './auth.js';
import express, { Response, Request } from 'express';
import DbConnection from '../constants/dbConnection.js';
import { Err } from '../constants/errors.js';
import { uploadPost } from './posts.js';
import { sourceMetadataInterface } from '../types/index.js';

const s3 = new S3Client({
	region: 'auto',
	endpoint: process.env.R2_ENDPOINT,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY || '',
		secretAccessKey: process.env.R2_SECRET_KEY || '',
	},
});

export async function generatePresignedUrl(
	userId: string,
	filename: string,
	contentType: string,
	db: DbConnection,
	duration: number,
	width: number,
	height: number,
) {
	const videoId = uuidv4();
	const key = `${userId}/${videoId}/${filename}`;

	const connOrErr = await db.connect();
	if (connOrErr instanceof Err) throw connOrErr;
	const conn = connOrErr;

	try {
		await conn.execute(
			"INSERT INTO sources (id, userId, `key`, `status`, duration, width, height) VALUES (?, ?, ?, 'pending', ?, ?, ?)",
			[videoId, userId, key, duration, width, height],
		);
	} finally {
		conn.release();
	}

	const command = new PutObjectCommand({
		Bucket: process.env.R2_BUCKET_NAME,
		Key: key,
		ContentType: contentType,
	});

	const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes

	return { url, videoId, key };
}

export async function markSourceUploaded(
	req: Request,
	res: Response,
	videoId: string,
	db: DbConnection,
	metadata: sourceMetadataInterface, // for metadata.type execute db code for posts table...
	sourceKey: string,
) {
	const connOrErr = await db.connect();
	if (connOrErr instanceof Err) throw connOrErr;
	const conn = connOrErr;

	try {
		await conn.execute(
			"UPDATE Sources SET status = 'uploaded', sourceRatio = ? WHERE id = ?",
			[metadata.data.ratio, videoId],
		);

		// for uploading a post (its metadata not the files itself)
		if (metadata.type === 'Video') {
			uploadPost(req, res, metadata, db, sourceKey);
			// execute post.ts middleware function for uploading post meta data
		}
	} finally {
		conn.release();
	}
}
