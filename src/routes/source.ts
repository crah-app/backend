import express, { Response, Request } from 'express';
import {
	generatePresignedUrl,
	markSourceUploaded,
} from '../middleware/source.js';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import DbConnection, { dbConnection } from '../constants/dbConnection.js';

const secret = process.env.CLERK_SECRET_KEY!;
const router = express.Router({ mergeParams: true });

router.use(express.json());

/* 
	client wants to upload a video. 
	Therefore client sends metadata to predict a video upload
*/

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
			extra_source,
			extra_source_filename,
			extra_source_content_type,
		} = req.body;

		console.log(
			userId,
			filename,
			duration,
			height,
			width,
			contentType,
			extra_source,
			extra_source_filename,
			extra_source_content_type,
		);

		const result = await generatePresignedUrl(
			userId,
			filename,
			contentType,
			dbConnection,
			duration,
			width,
			height,

			// extra source meta data
			extra_source,
			extra_source_filename,
			extra_source_content_type,
		);
		res.json(result);
	},
);

router.post('/mark-source-as-uploaded', async (req, res) => {
	const {
		sourceId,
		metadata,
		key,
		extra_file_key /* in case a second source is associated with this source. F.ex a cover for a video post */,
	} = req.body;
	await markSourceUploaded(
		req,
		res,
		sourceId,
		dbConnection,
		metadata,
		key,
		extra_file_key,
	);
});

export default router;
