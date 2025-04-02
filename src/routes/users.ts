import express from 'express';
import { Response, Request } from 'express';
import { dbConnection } from '../constants/dbConnection.js';
import { errorHandler } from '../constants/errors.js';
import { getAllUsers, getUserStats } from '../middleware/users.js';

const router = express.Router({ mergeParams: true });

/* 
e.g

curl http://localhost:4000/users/all
*/

router.get('/all', async (req: Request, res: Response) => {
	errorHandler(await getAllUsers(res), res);
});

/* 
e.g

curl http://localhost:4000/users/stats/userId=?
*/

router.get('/:userId', async (req: Request, res: Response) => {
	errorHandler(await getUserStats(req, res), res);
});

export default router;
