export interface Err {
	type: ErrType,
	message?: any
}

// HTTP ERROR CODES TO ADJUST
export enum ErrType {
	MySqlConnectionFailed = 500,
	MySqlFailedQuery = 404,
	JwtTokenNotFound = 300,
	JwtTokenMissingIat = 200,
	JwtTokenMissingSub = 100,
	JwtTokenExpired = 150,
}
