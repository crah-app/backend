import jwt, { Jwt } from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { Err, ErrType } from './errors.js';

// https://clerk.com/docs/backend-requests/handling/manual-jwt

interface JWTRequest extends Request {
	token: string | JwtPayload;
}

export async function verifyJwt(req: Request, res: Response, secret: string, next: (userId: string, ...args: any) => Promise<Err | void>): Promise<Err | void> {
	const token: undefined | string = req.header('Authorization')?.replace('Bearer ', '');

	if (!token) return {type: ErrType.JwtTokenNotFound};

	const decoded = jwt.verify(token, secret);

	if (!(decoded as JwtPayload).exp) return { 
		type: ErrType.JwtTokenMissingExp,
		message: "The JwtToken is missing the exp field!"
	};

	(req as JWTRequest).token = decoded;

	const currentTime = Math.floor(Date.now() / 1000);

	if ((decoded as JwtPayload).exp! < currentTime) return {
		type: ErrType.JwtTokenExpired,
		message: "The JwtToken has expired!"
	};

	if (!(decoded as JwtPayload).sub) return {
		type: ErrType.JwtTokenMissingSub,
		message: "The JwtToken is missing the sub field!"
	};

	return next(((decoded as JwtPayload).sub!));
}

