import express from 'express';
import {
	getTricks,
	deleteTrick,
	postTrick,
	getTrick,
	getAllTricks,
	setCurrentUserTricks,
} from '../middleware/tricks.js';
import { errorHandler, Err } from '../constants/errors.js';
import { dbConnection } from '../constants/dbConnection.js';
import { verifySessionToken } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });
const secret = process.env.CLERK_SECRET_KEY!;

router.use(express.json());

export default router;

/* Get all tricks */
router.get('/all', async (req, res) => {
	errorHandler(await getAllTricks(req, res, dbConnection), res);
});

router
	.route('/create')
	/* 
	curl -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjkwMjMyMTMzMTJ9.4aSibw17HQ5J0ehcQUnCkjYtEjdhFoz7R2G5YEIlrRs' -H 'Content-Type: application/json' --data '{"parts": ["fakie", "quad", "whip"], "spots": [{"spot": 0, "date":"2025-03-01"}, {"spot":3, "date":null}, {"spot":4, "date": null}]}' --request POST 'http://localhost:4000/api/tricks'
	*/
	.post(async (req, res) => {
		errorHandler(await postTrick(req, res, dbConnection, secret), res);
	});

/* 
curl -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNTE2MjM5MjM0NjI2MjR9._rbyL-KlSoffzaw4XXsUpnTzThu3oLWaq84QCvScjY8' --request DELETE 'http://localhost:3000/api/tricks/remove?trickId=0'
*/

router.delete('/:trickId', async (req, res) => {
	errorHandler(await deleteTrick(req, res, dbConnection, secret), res);
});

router.get('/:trickId', async (req, res) => {
	errorHandler(await getTrick(req, res, dbConnection), res);
});

/*
curl http://localhost:3000/api/tricks?userId=1
*/

router.get('/:userId', async (req, res) => {
	errorHandler(await getTricks(req, res, dbConnection), res);
});

/*
curl -H 'Authorization: Bearer "clerk-token" http://localhost:4000/api/tricks/${userId}/setTricks -b "tricks-json"

current-user initiaizes/updates his (5) best tricks
*/

router.post('/:userId/setTricks', async (req, res) => {
	errorHandler(await setCurrentUserTricks(req, res, dbConnection), res);
});
