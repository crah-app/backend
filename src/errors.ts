export interface Err {
	type: ErrType,
	message?: any
}

export enum ErrType {
	MySqlConnectionFailed = 500,
	MySqlFailedQuery = 404,
	JwtTokenNotFound = 300,
	JwtTokenMissingIat = 200,
	JwtTokenMissingSub = 100,
	JwtTokenExpired = 150,
}
