import { Err, ErrType } from './errors.js';
import mysql, { Connection, Query } from 'mysql2';

export default class DbConnection {
	inner: Connection;

	constructor(host: string, database: string, user: string, password: string) {
		this.inner = mysql.createConnection({
			host: host,
			user: user,
			password: password,
			database: database,
		});
	}

	connect(): Err | undefined {
		this.inner.connect((err) => {
			if (err) return { type: ErrType.MySqlConnectionFailed, content: err };
			console.log('Connected to MySQL with ID ' + this.inner.threadId);
		});
		return;
	}

	query(
		sql: string,
		values: any,
		callback?:
			| ((
					err: mysql.QueryError | null,
					result: mysql.QueryResult,
					fields: mysql.FieldPacket[],
			  ) => any)
			| undefined,
	): Query {
		return this.inner.query(sql, values, callback);
	}
}
