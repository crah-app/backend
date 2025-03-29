import { Response } from 'express';

type Failable<T> = Err | T;

export function errorHandler<T>(e: Failable<T>, res: Response, fn?: Function) {
	if (e instanceof Err) {
		e.log();
		res.status(ErrType.getHttpErrorCode(e.type)).send(e.message);
	} else if (fn !== undefined) fn();
}

export class Err {
	type: ErrType;
	message?: any;

	constructor(type: ErrType, message?: any) {
		this.type = type;
		this.message = message;
	}

	log() {
		console.error('\n');
		console.error('!!! ERROR !!!');
		console.error('STATUS CODE: ' + ErrType.getHttpErrorCode(this.type));
		console.error('ERROR TYPE: ' + ErrType[this.type]);
		if (this.message) {
			console.error('ERROR MESSAGE: ' + this.message);
		} else {
			console.error('NO ERROR MESSAGE');
		}
		console.error('\n');
	}
}

export enum ErrType {
	MySqlConnectionFailed,
	MySqlFailedQuery,
	JwtTokenNotFound,
	JwtTokenMissingExp,
	JwtTokenMissingSub,
	JwtTokenExpired,
	RequestMissingProperty,
	InvalidPostType,
	PostNotFound,
}

export namespace ErrType {
	export function getHttpErrorCode(type: ErrType): number {
		switch (type) {
			case ErrType.MySqlConnectionFailed:
				return 500; // Internal Server error
			case ErrType.MySqlFailedQuery:
				return 500; // Internal Server error
			case ErrType.JwtTokenNotFound:
				return 400; // Bad Request
			case ErrType.JwtTokenMissingExp:
				return 401; // Unauthorized
			case ErrType.JwtTokenMissingSub:
				return 401; // Unauthorized
			case ErrType.JwtTokenExpired:
				return 401; // Unauthorized
			case ErrType.RequestMissingProperty:
				return 400; // Bad Request
			case ErrType.InvalidPostType:
				return 500; // Internal Server error
			case ErrType.PostNotFound:
				return 404; // Not Found
		}
	}
}
