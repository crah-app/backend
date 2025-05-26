import { Err, ErrType } from './errors.js';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
dotenv.config();

export default class DbConnection {
	pool: mysql.Pool;

	constructor(
		host: string,
		database: string,
		user: string,
		password: string,
		port: number,
		limit: number,
	) {
		this.pool = mysql.createPool({
			host,
			user,
			password,
			database,
			port,
			connectionLimit: limit,
		});
	}

	async connect(): Promise<mysql.PoolConnection | Err> {
		try {
			const conn = await this.pool.getConnection();
			return conn;
		} catch (err) {
			return new Err(ErrType.MySqlConnectionFailed, err);
		}
	}

	async execute(query: string, params: any[]): Promise<any> {
		const conn = await this.connect();
		if (conn instanceof Err) throw conn;

		try {
			const [results] = await conn.query(query, params);
			return results;
		} finally {
			conn.release();
		}
	}
}

export const dbConnection = new DbConnection(
	process.env.DB_HOST!,
	process.env.DB_NAME!,
	process.env.DB_USER!,
	process.env.DB_PASSWORD!,
	3306,
	Number(process.env.DB_CONNECTION_LIMIT),
);
