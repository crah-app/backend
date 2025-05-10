import express from 'express';
import {
	generatePresignedUrl,
	markVideoUploaded,
} from '../services/sourceService.js';

const router = express.Router();

router.post('/presign', async (req, res) => {
	const { userId, filename, contentType } = req.body;
	const result = await generatePresignedUrl(userId, filename, contentType);
	res.json(result);
});

router.post('/markUploaded', async (req, res) => {
	const { videoId } = req.body;
	await markVideoUploaded(videoId);
	res.json({ success: true });
});

export default router;
