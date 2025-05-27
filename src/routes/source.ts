import express, { Response, Request } from 'express';
import {
	generatePresignedUrl,
	markSourceUploaded,
} from '../middleware/source.js';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import DbConnection, { dbConnection } from '../constants/dbConnection.js';

const secret = process.env.CLERK_PEM_PUBLIC_KEY!;
const router = express.Router({ mergeParams: true });

router.use(express.json());

/* 
	client wants to upload a video. 
	Therefore client sends metadata to predict a video upload
*/

router.get('/', (req, res) => {
	res.json({ foo: 'bar' });
});

router.post(
	'/create-upload',
	// ClerkExpressWithAuth() as unknown as express.RequestHandler,
	async (req, res) => {
		const {
			userId,
			filename,
			duration,
			height,
			width,
			contentType /* MIME-type */,
		} = req.body;

		console.log(userId, filename, duration, height, width, contentType);

		const result = await generatePresignedUrl(
			userId,
			filename,
			contentType,
			dbConnection,
			duration,
			width,
			height,
		);
		res.json(result);
	},
);

router.post('/mark-source-as-uploaded', async (req, res) => {
	const { videoId, metadata, key } = req.body;
	await markSourceUploaded(req, res, videoId, dbConnection, metadata, key);
});

export default router;
