import express, { Response, Request } from 'express';
import { dbConnection } from '../constants/dbConnection.js';
import { errorHandler } from '../constants/errors.js';
import {
	getUserNotifications,
	readUserNotification,
} from '../middleware/notifications.js';

const router = express.Router({ mergeParams: true });
router.use(express.json());
export default router;

/* 
Get notifications
*/

router.get('/', async (req, res) => {
	errorHandler(await getUserNotifications(req, res, dbConnection), res);
});

/* 
Read notifications
*/

router.post('/read', async (req, res) => {
	errorHandler(await readUserNotification(req, res, dbConnection), res);
});
