import express from 'express';
import { Application, Request, Response } from 'express';
import cors from 'cors';
import { Err, Success } from './errors.js';

export class App {
	inner: Application;

	constructor() {
		let app = express();
		app.use(cors());
		app.use(express.json());
		app.use("/assets", express.static('assets'));
		
		this.inner = app;
	}

	async get(path: string, fn: (req: Request, res: Response) => Promise<Err | Success>) {
		this.inner.get(path, async (req, res) => {
			let end = await fn(req, res);
			
			if("type" in end) {
				console.error(end);
				res.status(end.type).send(end.message);
			} else {
				end(req, res);
			}
		});
	}

	async post(path: string, fn: (req: Request, res: Response) => Promise<Err | Success>) {
		this.inner.post(path, async (req, res) => {
			let end: Err | Success = await fn(req, res);
			
			if("type" in end) {
				console.error(end);
				res.status(end.type).send(end.message);
			} else {
				end(req, res);
			}
		});
	}

	async delete(path: string, fn: (req: Request, res: Response) => Promise<Err | Success>) {
		this.inner.delete(path, async (req, res) => {
			let end: Err | Success = await fn(req, res);

			if("type" in end) {
				console.error(end);
				res.status(end.type).send(end.message);
			} else {
				end(req, res);
			}
		});
	}

	listen(port: string) {
		this.inner.listen(port, () => {
			console.log("Server listening at port: " + port);
		});
	}
}
