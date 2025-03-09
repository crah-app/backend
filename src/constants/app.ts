import express from 'express';
import { Application, Request, Response, Router } from 'express';
import cors from 'cors';
import { Err } from './errors.js';

export interface AppDescription {
	assetsDir: string,
	assetsPath: string,
	rootPath: string
}

export class App {
	inner: Application;
	router: Router;

	constructor(desc: AppDescription) {
		let app = express();
		app.use(cors());
		app.use(express.json());
		app.use('/${desc.assetsPath}', express.static(desc.assetsDir));

		const router = express.Router();
		app.use(desc.rootPath, router);
		
		this.inner = app;
		this.router = router;
	}

	getInner(): Application {
		return this.inner;
	}

	getRouter(): Router {
		return this.router;
	}

	listen(port: string) {
		this.inner.listen(port, () => {
			console.log('Server listening at port: ' + port);
		});
	}
}
