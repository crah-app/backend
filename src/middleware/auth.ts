import jwt, { Jwt } from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { Err, ErrType } from './../constants/errors.js';
import jwksClient from 'jwks-rsa';

// https://clerk.com/docs/backend-requests/handling/manual-jwt

interface JWTRequest extends Request {
	token: string | JwtPayload;
}

const client = jwksClient({
	jwksUri: 'https://steady-panda-59.clerk.accounts.dev/.well-known/jwks.json',
});

function getKey(header: any, callback: any) {
	client.getSigningKey(header.kid, function (err, key) {
		if (err) return callback(err);
		const signingKey = key?.getPublicKey();
		callback(null, signingKey);
	});
}

export async function verifySessionToken(
	req: Request,
	res: Response,
): Promise<{ sessionToken: null | any }> {
	return new Promise((resolve, reject) => {
		const authHeader = req.headers.authorization;
		const token = authHeader?.replace('Bearer ', '');

		if (!token) {
			return res.status(401).json({ error: 'No token provided' });
		}

		jwt.verify(
			token,
			getKey,
			{ algorithms: ['RS256'] },
			(err, decoded: any) => {
				if (err) {
					res.status(400).json({ error: err.message });
					resolve({ sessionToken: null });
				}

				const currentTime = Math.floor(Date.now() / 1000);
				if (decoded.exp < currentTime || decoded.nbf > currentTime) {
					res.status(401).json({ error: 'Token is expired or not yet valid' });
					resolve({ sessionToken: null });
				}

				const permittedOrigins = ['http://localhost:4000'];
				if (decoded.azp && !permittedOrigins.includes(decoded.azp)) {
					res.status(403).json({ error: "Invalid 'azp' claim" });
					resolve({ sessionToken: null });
				}

				resolve({ sessionToken: decoded });
			},
		);
	});
}

export async function verifyJwt(
	req: Request,
	res: Response,
	secret: string,
	next: (userId: string, ...args: any) => Promise<Err | void> | any,
): Promise<Err | void> {
	const token: undefined | string = req
		.header('Authorization')
		?.replace('Bearer ', '');

	if (!token) return new Err(ErrType.JwtTokenNotFound);

	const decoded = jwt.verify(token, secret);

	if (!(decoded as JwtPayload).exp)
		return new Err(
			ErrType.JwtTokenMissingExp,
			'The JwtToken is missing the exp field!',
		);

	(req as JWTRequest).token = decoded;

	const currentTime = Math.floor(Date.now() / 1000);

	if ((decoded as JwtPayload).exp! < currentTime)
		return new Err(ErrType.JwtTokenExpired, 'The JwtToken has expired!');

	if (!(decoded as JwtPayload).sub)
		return new Err(
			ErrType.JwtTokenMissingSub,
			'The JwtToken is missing the sub field!',
		);

	try {
		return await next((decoded as JwtPayload).sub!);
	} catch (error) {
		return error as Err;
	}
}
