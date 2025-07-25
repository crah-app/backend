import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import jwksClient from 'jwks-rsa';

// https://clerk.com/docs/backend-requests/handling/manual-jwt

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
			resolve({ sessionToken: null });
			return res.status(401).json({ error: 'No token provided' });
		}

		jwt.verify(
			token,
			getKey,
			{ algorithms: ['RS256'] },
			(err, decoded: any) => {
				if (err) {
					resolve({ sessionToken: null });
					return res.status(400).json({ error: err.message });
				}

				const currentTime = Math.floor(Date.now() / 1000);
				if (decoded?.exp < currentTime || decoded?.nbf > currentTime) {
					resolve({ sessionToken: null });
					return res
						.status(401)
						.json({ error: 'Token is expired or not yet valid' });
				}

				const permittedOrigins = ['http://localhost:4000'];
				if (decoded?.azp && !permittedOrigins.includes(decoded?.azp)) {
					resolve({ sessionToken: null });
					return res.status(403).json({ error: "Invalid 'azp' claim" });
				}

				resolve({ sessionToken: decoded });
			},
		);
	});
}
