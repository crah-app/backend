import jwt, { Jwt } from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { Err, ErrType } from './../constants/errors.js';

// https://clerk.com/docs/backend-requests/handling/manual-jwt

interface JWTRequest extends Request {
	token: string | JwtPayload;
}

export async function verifyJwt(req: Request, res: Response, secret: string, next: (userId: string, ...args: any) => Promise<Err | void>): Promise<Err | void> {
	const token: undefined | string = req.header('Authorization')?.replace('Bearer ', '');

	if (!token) return new Err(ErrType.JwtTokenNotFound);

	const decoded = jwt.verify(token, secret);

	if (!(decoded as JwtPayload).exp) return new Err( 
		ErrType.JwtTokenMissingExp,
		"The JwtToken is missing the exp field!"
	);

	(req as JWTRequest).token = decoded;

	const currentTime = Math.floor(Date.now() / 1000);

	if ((decoded as JwtPayload).exp! < currentTime) return new Err(
		ErrType.JwtTokenExpired,
		"The JwtToken has expired!"
	);

	if (!(decoded as JwtPayload).sub) return new Err(
		ErrType.JwtTokenMissingSub,
		"The JwtToken is missing the sub field!"
	);

	try {
		return await next(((decoded as JwtPayload).sub!));
	} catch (error) {
		return error as Err;
	}
}

