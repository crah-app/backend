import express from 'express';
import { dbConnection } from '../constants/dbConnection.js';
import { errorHandler } from '../constants/errors.js';
import {
	getRankOvertime,
	getUserRank,
	postUserRank,
} from '../middleware/ranks.js';

const router = express.Router({ mergeParams: true });
router.use(express.json());
export default router;

/*
    get rank of user
*/

router.get('/:userId', async (req, res) => {
	errorHandler(await getUserRank(req, res, dbConnection), res);
});

// set rank of user
router.post('/:userId', async (req, res) => {
	errorHandler(await postUserRank(req, res, dbConnection), res);
});

// get rank overtime of user
router.get('/:userId/overtime/:interval', async (req, res) => {
	errorHandler(await getRankOvertime(req, res, dbConnection), res);
});
