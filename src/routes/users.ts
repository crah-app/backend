import express from 'express';
import { Response, Request } from 'express';
import { dbConnection } from '../constants/dbConnection.js';
import { errorHandler } from '../constants/errors.js';
import {
	getAllUsers,
	getFriendsOfUser,
	getGlobalLeaderboard,
	getRidersOfSpecificRank,
	getUserStats,
	isUsernameDuplicate,
	searchRankedUser,
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

// get data of user
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

// get all users of specific rank
router.get(
	'/rank/:rank/:limit/:offset',
	async (req: Request, res: Response) => {
		errorHandler(await getRidersOfSpecificRank(req, res, dbConnection), res);
	},
);

// get all users ranked in a global leaderboard
router.get(
	'/ranked/global/:limit/:offset',
	async (req: Request, res: Response) => {
		errorHandler(await getGlobalLeaderboard(res, req, dbConnection), res);
	},
);

// search a user in the leaderboards
router.get(
	'/ranked/:limit/:offset/search',
	async (req: Request, res: Response) => {
		errorHandler(await searchRankedUser(req, res, dbConnection), res);
	},
);

export default router;
