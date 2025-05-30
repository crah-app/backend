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
