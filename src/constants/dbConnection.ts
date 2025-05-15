import { Err, ErrType } from './errors.js';
import dotenv from 'dotenv';
import mysql, { PoolConnection, Query, Pool } from 'mysql2';
dotenv.config();

export default class DbConnection {
	pool: Pool;

	constructor(
		host: string,
		database: string,
		user: string,
		password: string,
		port: number,
		limit: number,
	) {
		this.pool = mysql.createPool({
			host: host,
			user: user,
			password: password,
			database: database,
			connectionLimit: limit,
			port: port,
		});
	}

	async connect(): Promise<PoolConnection | Err> {
		try {
			return await new Promise<PoolConnection>((resolve) => {
				this.pool.getConnection((err, conn) => {
					if (!conn) throw new Err(ErrType.MySqlConnectionFailed, err);
					else resolve(conn);
				});
			});
		} catch (e) {
			return e as Err;
		}
	}

	async execute(query: string, params: any[]): Promise<any> {
		const conn = await this.connect();
		if (conn instanceof Err) throw conn;

		try {
			return await conn.execute(query, params);
		} finally {
			conn.release();
		}
	}

	/*async connect(callback: (conn: PoolConnection, resolve: any, reject: any) => any): Promise<Err | any> {
		try {
			return await new Promise<any>((resolve, reject) => {
				this.pool.getConnection(async(err, conn) => {
					if(err) {
						conn.release();
						reject(new Err(ErrType.MySqlConnectionFailed));
						return;
					}
					
					callback(conn, resolve, reject);
					conn.release();
				});
			});
		} catch(e) {
			console.log(e);
			return e as Err;
		}
	}
	*/
}

export const dbConnection = new DbConnection(
	process.env.DB_HOST!,
	process.env.DB_NAME!,
	process.env.DB_USER!,
	process.env.DB_PASSWORD!,
	3306,
	Number(process.env.DB_CONNECTION_LIMIT),
);
