import dotenv from 'dotenv';
import express from 'express'; 
import cors from 'cors';       
import { getTrickList, postTrick, deleteTrick } from './constants/trickListApi.js';
import pool, {} from './constants/dbConnection.js';

dotenv.config();

const app = express();  

// Middleware for CORS and JSON-Parsing
app.use(cors());
app.use(express.json());

// static files
app.use("/public", express.static('public'));

/*
e.g
 
curl http://localhost:0000/api/tricks?userId=1
*/

app.get("/api/tricks", (req, res) => {
	getTrickList(req, res, pool);
});

app.post("/api/tricks/new", (req, res) => {
	postTrick(req, res, pool, process.env.CLERK_PEM_PUBLIC_KEY!);
});

app.delete("/api/tricks/remove", (req, res) => {
	deleteTrick(req, res, pool, process.env.CLERK_PEM_PUBLIC_KEY!);
});

app.listen(process.env.PORT, () => {
	console.log(`listen on PORT ${process.env.PORT}`)
})