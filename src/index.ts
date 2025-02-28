import dotenv from 'dotenv';
import { getTrickList, postTrick, deleteTrick } from "./constants/trickListApi.js";
import { App } from "./constants/app.js";
import DbConnection from "./constants/dbConnection.js";
import { Err, ErrType, Success } from './constants/errors.js';

dotenv.config();

let dbConn = new DbConnection(
	process.env.DB_HOST!,
	process.env.DB_NAME!,
	process.env.DB_USER!,
	process.env.DB_PASSWORD!
);

dbConn.connect();

let app: App = new App();  

/*
e.g
 
curl http://localhost:0000/api/tricks?userId=1
*/

app.get("/api/tricks", (req, res) => {
	let result:any;

	try {
		result = getTrickList(req, res, dbConn);
	} catch (error) {
		console.log(error);
		return result;
	};

	return result;
});

/* 
e.g

curl -H 'Authorization: Bearer \
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjQ0NDQ0NDQ0MzkwMDB9.ojW668Z4CJwA_JcG2hIj7jQ6utRngeP3v558TANpV2c'\
-H 'Content-Type: application/json' --data '{"parts": ["fakie", "double", "whip"], "spots": [0], "date": null}'\
--request POST 'http://localhost:0000/api/tricks/new'
*/

app.post("/api/tricks/new", (req, res) => {
	return postTrick(req, res, dbConn, process.env.CLERK_PEM_PUBLIC_KEY!);
});

/* 
e.g

curl -H 'Authorization: Bearer \
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNTE2MjM5MjM0NjI2MjR9._rbyL-KlSoffzaw4XXsUpnTzThu3oLWaq84QCvScjY8' \
--request DELETE 'http://localhost:0000/api/tricks/remove?trickid=0'
*/

app.delete("/api/tricks/remove", (req, res) => {
	return deleteTrick(req, res, dbConn, process.env.CLERK_PEM_PUBLIC_KEY!);
});

app.listen(process.env.PORT!);