import express from 'express';
import { Response, Request } from 'express';
import { dbConnection } from '../constants/dbConnection.js';
import { errorHandler } from '../constants/errors.js';
import {
	getAllUsers,
	getFriendsOfUser,
	getUserStats,
	isUsernameDuplicate,
	setRiderTypeOfUser,
} from '../middleware/users.js';

const router = express.Router({ mergeParams: true });

router.use(express.json());

/* 
get all user data

e.g

curl http://localhost:4000/api/users/all
*/

router.get('/all', async (req: Request, res: Response) => {
	errorHandler(await getAllUsers(res, req, dbConnection), res);
});

/* 
get data of current-user

e.g

curl http://localhost:4000/api/users/1
*/

router.get('/:userId', async (req: Request, res: Response) => {
	errorHandler(await getUserStats(req, res, dbConnection), res);
});

/* 

check wether username is duplicate

e.g

curl http://localhost:4000/api/users/username/nameIsDuplicate
*/

router.get(
	'/:userName/nameIsDuplicate',
	async (req: Request, res: Response) => {
		errorHandler(await isUsernameDuplicate(req, res, dbConnection), res);
	},
);

/* 
post rider type of current-user

use bearer
*/

router.post('/:userId/setRiderType', async (req: Request, res: Response) => {
	errorHandler(await setRiderTypeOfUser(req, res, dbConnection), res);
});

/* 
friends of user
*/
router.get('/:userId/friends', async (req: Request, res: Response) => {
	errorHandler(await getFriendsOfUser(req, res, dbConnection), res);
});

export default router;
