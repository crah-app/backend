import express from 'express';
import { Application, Request, Response } from 'express';
import cors from 'cors';
import { Err } from './errors.js';

export class App {
	inner: Application;

	constructor() {
		let app = express();
		app.use(cors());
		app.use(express.json());
		app.use('/public', express.static('public'));

		this.inner = app;
	}

	async get(
		path: string,
		fn: (req: Request, res: Response) => Promise<Err | void> | Err | void,
	) {
		this.inner.get(path, async (req, res) => {
			let end = await fn(req, res);

			if (typeof end == 'object') {
				console.error(end);
				res.status(end.type).send(end.message);
			}
		});
	}

	async post(
		path: string,
		fn: (req: Request, res: Response) => Promise<Err | void>,
	) {
		this.inner.post(path, async (req, res) => {
			let end: Err | void = await fn(req, res);

			if (typeof end === 'object') {
				console.error(end);
				res.status(end.type).send(end.message);
			}
		});
	}

	async delete(
		path: string,
		fn: (req: Request, res: Response) => Promise<Err | void>,
	) {
		this.inner.delete(path, async (req, res) => {
			let end: Err | void = await fn(req, res);

			if (typeof end == 'object') {
				console.error(end);
				res.status(end.type).send(end.message);
			}
		});
	}

	listen(port: string) {
		this.inner.listen(port, () => {
			console.log('Server listening at port: ' + port);
		});
	}
}
