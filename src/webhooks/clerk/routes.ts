import { verifyWebhook } from '@clerk/express/webhooks';
import express from 'express';
import { handleUser } from './middleware.js';
import { UserJSON } from '@clerk/backend';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router({ mergeParams: true });
export default router;

router.get('/', (req, res) => {
	res.send('hello world');
});

router.post(
	'/users',
	express.raw({ type: 'application/json' }),
	async (req, res): Promise<any> => {
		console.log('trying...');

		try {
			const evt = await verifyWebhook(req);

			// Do something with payload
			// For this guide, log payload to console
			const data: UserJSON = evt.data as UserJSON;
			const eventType = evt.type;

			console.log(data, eventType);
			return handleUser(eventType, data, req, res);
		} catch (err) {
			console.error('Error verifying webhook:', err);
		}
	},
);
