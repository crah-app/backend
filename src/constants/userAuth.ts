import jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
import { Request, Response } from 'express';
import { Success, Err, ErrType } from './errors';

// https://clerk.com/docs/backend-requests/handling/manual-jwt

interface JWTRequest extends Request {
	token: string | JwtPayload;
}

export async function verifyJwt(req: Request, res: Response, secret: string, next: Function): Promise<Err | Success> {
   const token: undefined | string = req.header('Authorization')?.replace('Bearer ', '');

   if (!token) return {type: ErrType.JwtTokenNotFound};

   const decoded = jwt.verify(token, secret);
   if (!(decoded as JwtPayload).iat) return {type: ErrType.JwtTokenMissingIat};
   
   (req as JWTRequest).token = decoded;
   
   const currentTime = Math.floor(Date.now() / 1000);

   if ((decoded as JwtPayload).iat! < currentTime) return {type: ErrType.JwtTokenExpired};
   console.log((decoded as JwtPayload).sub!);
   if ((decoded as JwtPayload).sub !== undefined ) return {type: ErrType.JwtTokenMissingSub};

   return next(req, res, (decoded as JwtPayload).sub);
}

