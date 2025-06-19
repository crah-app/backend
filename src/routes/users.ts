import express from 'express';
import { Response, Request } from 'express';
import { dbConnection } from '../constants/dbConnection.js';
import { errorHandler } from '../constants/errors.js';
import {
	getAllUsers,
	getUserStats,
	isUsernameDuplicate,
} from '../middleware/users.js';

const router = express.Router({ mergeParams: true });

router.use(express.json());

/* 
e.g

curl http://localhost:4000/api/users/all
*/

router.get('/all', async (req: Request, res: Response) => {
	errorHandler(await getAllUsers(res), res);
});

/* 
e.g

curl http://localhost:4000/api/users/1
*/

router.get('/:userId', async (req: Request, res: Response) => {
	errorHandler(await getUserStats(req, res, dbConnection), res);
});

/* 
e.g

curl http://localhost:4000/api/users/username/nameIsDuplicate
*/

router.get(
	'/:userName/nameIsDuplicate',
	async (req: Request, res: Response) => {
		errorHandler(await isUsernameDuplicate(req, res, dbConnection), res);
	},
);

export default router;
