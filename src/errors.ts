export interface Err {
	type: ErrType,
	message?: any
}

export enum ErrType {
	MySqlConnectionFailed = 500, // Internal Server error
	MySqlFailedQuery = 500, // Internal Server error
	JwtTokenNotFound = 400, // Bad Request
	JwtTokenMissingIat = 401, // Unauthorized
	JwtTokenMissingSub = 401, // Unauthorized
	JwtTokenExpired = 401, // Unauthorized
}
