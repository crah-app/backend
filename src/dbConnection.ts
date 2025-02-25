import { Err, ErrType } from './errors';
import mysql from 'mysql';
import { Connection, Query } from 'mysql';
import { Request, Response } from 'express';

export class DbConnection {
	inner: Connection;
	
	constructor(host: string, database: string, user: string, password: string) {
		this.inner = mysql.createConnection({
			host: host,
			user: user,
			password: password,
			database: database
		});
	}
	
	connect(): Err | undefined {
		this.inner.connect((err) => {
			if(err) return {type: ErrType.MySqlConnectionFailed, content: err};
			console.log("Connected to MySQL with ID " + this.inner.threadId);
		});
		return;
	}
	
	query<T>(query: string, fn: (err: any, results: any) => T) {
		return this.inner.query(query, fn);
	}
}
