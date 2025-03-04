import { Response } from 'express';

export function defaultNamespaceRequest(res: Response) {
	res.send(`hello world. This is the crah api. ${process.env}`);
}
