import { RowDataPacket } from 'mysql2';

export type postTypes = 'Article' | 'Video' | 'Post' | 'Music';

export interface sourceMetadataInterface {
	type: postTypes;
	userId: string;
	data: any;
}

export interface PhotoFile {
	width: number;
	height: number;
}

export interface BestTrickRow extends RowDataPacket {
	TrickId: number;
	UserId: string;
	Name: string;
	Points: number;
	Difficulty: string;
	Spot: string;
	Date: string;
}

export interface BestTricksResult {
	err: string;
	error: any;
	rows: BestTrickRow[];
}
