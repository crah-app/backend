import express from 'express';
import { getTricks, deleteTrick, postTrick } from '../middleware/tricks.js';
import { errorHandler, Err } from '../constants/errors.js';
import { dbConnection }  from "../constants/dbConnection.js";

const router = express.Router({ mergeParams: true })
const secret = process.env.CLERK_PEM_PUBLIC_KEY!;

export default router;

router.route('/')
	/* 
	curl -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNTE2OTIzOTAyMn0.TEHZNVRuzcIBnxqrVbaxcLiPfV3IFtHynsV7tWQTAEU' -H 'Content-Type: application/json' --data '{"parts": ["fakie", "quad", "whip"], "spots": [0, 3, 4], "date": null}' --request POST 'http://localhost:3000/api/tricks'
	*/
	.post(async (req, res) => {
		errorHandler(await postTrick(req, res, dbConnection, secret ), res);
	})

/* 
curl -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNTE2MjM5MjM0NjI2MjR9._rbyL-KlSoffzaw4XXsUpnTzThu3oLWaq84QCvScjY8' --request DELETE 'http://localhost:3000/api/tricks/remove?trickId=0'
*/

router.delete('/:trickId', async (req, res) => {
	errorHandler(await deleteTrick(req, res, dbConnection, secret ), res);
});

/*
curl http://localhost:3000/api/tricks?userId=1
*/
router.get('/:userId', async (req, res) => {
	errorHandler(await getTricks(req, res, dbConnection), res);
});


