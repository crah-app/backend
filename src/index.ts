import dotenv from 'dotenv';
import { getTrickList, postTrick, deleteTrick } from "./constants/tricks.js";
import { getPost } from "./constants/posts.js";
import { defaultNamespaceRequest } from "./constants/root.js";
import { App } from "./constants/app.js";
import DbConnection from "./constants/dbConnection.js";
import { Response } from 'express';

dotenv.config();

let dbConn = new DbConnection(
	process.env.DB_HOST!,
	process.env.DB_USER!,
	process.env.DB_PASSWORD!,
	process.env.DB_NAME!,
	Number(process.env.DB_CONNECTION_LIMIT),
);

dbConn.connect();

let app: App = new App();

/*
	APIS TO WORK ON

	- GET TRICK LIST BY USER ID
	- (POST) ADD TRICK
	- (DELETE) REMOVE TRICK
	
	- GET POST BY POSTID
	- GET POSTS BY USERID
	- GET POSTS BY FILTERING OPTIONS?
	- GET POSTS (ALL, OR BY INDEX, last 100, +100 ...)
	- (POST) ADD POST 
	- (DELETE) REMOVE POST
	- (UPDATE) UPDATE POST
	
	- GET USERDATA
	- (POST) CREATE NEW USER
	- (DELETE) DELETE USER
	- (UPLOAD) CHANGE USER DATA
*/

app.get('/api', (req, res) => {
	return defaultNamespaceRequest(res);
});

/*
e.g
 
curl http://localhost:3000/api/tricks?userId=1
*/

app.get('/api/tricks', (req, res) => {
	return getTrickList(req, res, dbConn);
});

/* 
e.g

curl -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNTE2OTIzOTAyMn0.TEHZNVRuzcIBnxqrVbaxcLiPfV3IFtHynsV7tWQTAEU' -H 'Content-Type: application/json' --data '{"parts": ["fakie", "quad", "whip"], "spots": [0, 3, 4], "date": null}' --request POST 'http://localhost:3000/api/tricks/new'
*/

app.post('/api/tricks/new', (req, res) => {
	return postTrick(req, res, dbConn, process.env.CLERK_PEM_PUBLIC_KEY!);
});

/* 
e.g

curl -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNTE2MjM5MjM0NjI2MjR9._rbyL-KlSoffzaw4XXsUpnTzThu3oLWaq84QCvScjY8' --request DELETE 'http://localhost:3000/api/tricks/remove?trickId=0'
*/

app.delete('/api/tricks/remove', (req, res) => {
	return deleteTrick(req, res, dbConn, process.env.CLERK_PEM_PUBLIC_KEY!);
});

/* 
e.g

curl https://localhost:4000/api/posts?postId=2 --output post.zip
*/

app.get('/api/posts', (req, res) => {
	return getPost(req, res, dbConn);
});

app.listen(process.env.PORT!);
