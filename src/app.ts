import express from 'express';
import { Application, Request, Response } from 'express';
import cors from 'cors';
import { Err, ErrType } from './errors';
import { DbConnection } from './dbConnection';

export class App {
	inner: Application;

	constructor() {
		let app = express();
		app.use(cors());
		app.use(express.json());
		app.use("/assets", express.static('assets'));
		
		this.inner = app;
	}

	async get(path: string, fn: (req: Request, res: Response) => Promise<Err | undefined>) {
		this.inner.get(path, async (req, res) => {
			let err: Err | undefined = await fn(req, res);

			if(err !== undefined) {
				console.log(err);
				res.status(err!.type).send(err!.message);
			}
		});
	}

	async post(path: string, fn: (req: Request, res: Response) => Promise<Err | undefined>) {
		this.inner.post(path, async (req, res) => {
			let err: Err | undefined = await fn(req, res);
			
			if(err !== undefined) {
				console.log(err);
				res.status(err!.type).send(err!.message);
			}
		});
	}

	async delete(path: string, fn: (req: Request, res: Response) => Promise<Err | undefined>) {
		this.inner.delete(path, async (req, res) => {
			let err: Err | undefined = await fn(req, res);

			if(err !== undefined) {
				console.log(err);
				res.status(err!.type).send(err!.message);
			}
		});
	}

	listen(port: string) {
		this.inner.listen(port, () => {
			console.log("Server listening at port: " + port);
		});
	}
}
