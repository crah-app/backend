import { Request, Response } from 'express';

export interface Err {
	type: ErrType,
	message?: any
}

export enum ErrType {
	MySqlConnectionFailed = 500, // Internal Server error
	MySqlFailedQuery = 500, // Internal Server error
	JwtTokenNotFound = 400, // Bad Request
	JwtTokenMissingExp = 401, // Unauthorized
	JwtTokenMissingSub = 401, // Unauthorized
	JwtTokenExpired = 401, // Unauthorized
	RequestMissingProperty = 400, // Bad Request
	InvalidPostType = 500 // Internal Server error
}
