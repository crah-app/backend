import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2/promise';
import express, { Response, Request } from 'express';
import DbConnection from '../constants/dbConnection.js';
import { Err } from '../constants/errors.js';
import { uploadPost } from './posts.js';
import { PhotoFile, sourceMetadataInterface } from '../types/index.js';

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

	// additional source. Usually used as cover for a video post
	extra_source: PhotoFile | null,
	extra_source_filename: string | null,
	extra_source_content_type: string | null,
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

	let extra_source_data: {
		url: string;
		id: string;
		key: string;
	} | null = null;

	if (extra_source && extra_source_filename && extra_source_content_type) {
		extra_source_data = await generatePresignedUrlForExtraSource(
			extra_source_filename,
			userId,
			extra_source_content_type,
			db,
			extra_source.width,
			extra_source.height,
		);
	}

	return { url, videoId, key, extra_source_data };
}

// usually a video post cover. Therefore no duration value is passed
async function generatePresignedUrlForExtraSource(
	extra_source_filename: string,
	userId: string,
	contentType: string,
	db: DbConnection,
	width: number,
	height: number,
) {
	let extraSourceId = uuidv4();
	let extraSourceKey = `${userId}/${extraSourceId}/${extra_source_filename}`;

	const connOrErr = await db.connect();
	if (connOrErr instanceof Err) throw connOrErr;
	const conn = connOrErr;

	try {
		await conn.execute(
			"INSERT INTO sources (id, userId, `key`, `status`, duration, width, height) VALUES (?, ?, ?, 'pending', ?, ?, ?)",
			[extraSourceId, userId, extraSourceKey, 0, width, height],
		);
	} finally {
		conn.release();
	}

	const command = new PutObjectCommand({
		Bucket: process.env.R2_BUCKET_NAME,
		Key: extraSourceKey,
		ContentType: contentType,
	});

	const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes

	return {
		url: url,
		id: extraSourceId,
		key: extraSourceKey,
	};
}

export async function markSourceUploaded(
	req: Request,
	res: Response,
	sourceId: string,
	db: DbConnection,
	metadata: sourceMetadataInterface | undefined, // for metadata.type execute db code for posts table...
	sourceKey: string,
	coverSourceKey: string,
) {
	const connOrErr = await db.connect();
	if (connOrErr instanceof Err) {
		res.status(500).json({ success: false });
		throw connOrErr;
	}
	const conn = connOrErr;

	try {
		await conn.execute("UPDATE Sources SET status = 'uploaded' WHERE id = ?", [
			sourceId,
		]);

		conn.release();

		// for uploading a post (its metadata not the files itself)
		if (metadata?.type === 'Video') {
			// execute post.ts middleware function for uploading post meta data
			await uploadPost(req, res, metadata, db, sourceKey, coverSourceKey);
		}

		res.status(200).json({ success: true });
	} catch (err) {
		res.status(500).json({ success: false });
	}
}
