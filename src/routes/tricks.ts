import express from 'express';
import {
	getTrick,
	getAllTricks,
	setCurrentUserTricks,
	getBestTricksOfUser,
	getAllTricksOfUser,
	getOverallBestTricksOfUser,
	getPointsOfTricks,
	getBestTrickOfUser,
	getAllTricksFromUsersPerspective,
	getAllTricksFromUsersPerspectiveByGeneralType,
	getLateyLandedTricks,
} from '../middleware/tricks.js';
import { errorHandler } from '../constants/errors.js';
import { dbConnection } from '../constants/dbConnection.js';

const router = express.Router({ mergeParams: true });

router.use(express.json());

export default router;

/* 
Get points of one trick
*/
router.post('/points', async (req, res) => {
	errorHandler(await getPointsOfTricks(req, res, dbConnection), res);
});

/* Get all tricks */
router.get('/all', async (req, res) => {
	errorHandler(await getAllTricks(req, res, dbConnection), res);
});

// get lately created and lately landed tricks
router.get('/lately/:offset/:limit/:userId', async (req, res) => {
	errorHandler(await getLateyLandedTricks(res, req, dbConnection), res);
});

/* 
Get all tricks with trick info of the current-user

use bearer
 */
router.get('/all/:userId', async (req, res) => {
	errorHandler(
		await getAllTricksFromUsersPerspective(req, res, dbConnection),
		res,
	);
});

/* 
Get all tricks with trick info of the current-user

use bearer
 */
router.get('/all/:userId/:generaltype', async (req, res) => {
	errorHandler(
		await getAllTricksFromUsersPerspectiveByGeneralType(req, res, dbConnection),
		res,
	);
});

/* Get all tricks of current-user */
router.get('/:userId/all', async (req, res) => {
	errorHandler(await getAllTricksOfUser(req, res, dbConnection), res);
});

/* 
curl -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNTE2MjM5MjM0NjI2MjR9._rbyL-KlSoffzaw4XXsUpnTzThu3oLWaq84QCvScjY8' --request DELETE 'http://localhost:3000/api/tricks/remove?trickId=0'
*/

router.get('/:trickId', async (req, res) => {
	errorHandler(await getTrick(req, res, dbConnection), res);
});

/*
curl -H 'Authorization: Bearer "clerk-token" http://localhost:4000/api/tricks/${userId}/setTricks -b "tricks-json"

current-user initiaizes/updates his best tricks
*/

router.post('/:userId/setTricks', async (req, res) => {
	errorHandler(await setCurrentUserTricks(req, res, dbConnection), res);
});

/*
	get 5 best tricks of user in each spot Park, Street, Flat
*/

router.get('/:userId/bestFiveBySpot', async (req, res) => {
	errorHandler(await getBestTricksOfUser(req, res, dbConnection), res);
});

/*
	get 5 best tricks of user overall
*/

router.get('/:userId/bestFiveOverall', async (req, res) => {
	errorHandler(await getOverallBestTricksOfUser(req, res, dbConnection), res);
});

/* 
	get best trick of user
*/

router.get('/:userId/best', async (req, res) => {
	errorHandler(await getBestTrickOfUser(req, res, dbConnection), res);
});
