import { Response } from 'express';

export function defaultNamespace(res: Response) {
	res.send(`hello world. This is the crah api. ${process.env}`);
}
