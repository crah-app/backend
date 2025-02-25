import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mysql from 'mysql';

import { DbConnection } from "./dbConnection";
import { App } from "./app";
import { getTrickListByUserId, postTrickToTrickList, deleteTrickFromTrickList } from "./trickListApi";

import { Trick, TrickDescription } from "./tricks/trick";
import { Spot } from "./tricks/spot";

import Cookies from 'cookies';
import jwt from 'jsonwebtoken';

import { JwtPayload } from 'jsonwebtoken';
import { Request, Response } from 'express';

dotenv.config();

let dbConn = new DbConnection(process.env.DB_HOST!, process.env.DB_NAME!, process.env.DB_USER!, process.env.DB_PASSWORD!);
dbConn.connect();

let app: App = new App();

app.get("/api/tricks", (req, res) => {
	return getTrickListByUserId(req, res, dbConn);
});

app.post("/api/tricks/new", (req, res) => {
	return postTrickToTrickList(req, res, dbConn, process.env.CLERK_PEM_PUBLIC_KEY!);
});

app.delete("/api/tricks/remove", (req, res) => {
	return deleteTrickFromTrickList(req, res, dbConn, process.env.CLERK_PEM_PUBLIC_KEY!);
});

app.listen(process.env.PORT!);







