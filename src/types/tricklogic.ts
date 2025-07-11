import { GeneralSpot } from '../trickLogic/spot.js';

export enum TrickType {
	Balance, // 0
	Rewind, // 1
	Overhead, // 2
	Grab, // 3
	Whip, // 4
	Rotation, // 5
	BodyFlip, // 6
	None, // 7
}

export enum TrickDifficulty {
	Unknown = 'Unknown',
	Beginner = 'Beginner',
	Normal = 'Normal',
	Intermediate = 'Intermediate',
	Advanced = 'Advanced',
	Hard = 'Hard',
	VeryHard = 'Very Hard',
	Expert = 'Expert',
	Impossible = 'Impossible',
	Goated = 'Goated',
	Legendary = 'Legendary',
}

export const TrickDifficultyOrder = {
	Unknown: 0,
	Beginner: 1,
	Normal: 2,
	Intermediate: 3,
	Advanced: 4,
	Hard: 5,
	'Very Hard': 6,
	Expert: 7,
	Impossible: 8,
	Goated: 9,
	Legendary: 10,
} as const;

export namespace TrickDifficulty {
	export function getDifficultyByPoints(points: number): TrickDifficulty {
		if (points >= 1000) return TrickDifficulty.Legendary;
		if (points >= 800) return TrickDifficulty.Goated;
		if (points >= 650) return TrickDifficulty.Impossible;
		if (points >= 500) return TrickDifficulty.Expert;
		if (points >= 350) return TrickDifficulty.VeryHard;
		if (points >= 250) return TrickDifficulty.Hard;
		if (points >= 150) return TrickDifficulty.Advanced;
		if (points >= 90) return TrickDifficulty.Intermediate;
		if (points >= 40) return TrickDifficulty.Normal;
		return TrickDifficulty.Beginner;
	}
}

export interface AllTricksData {
	Name: string;
	DefaultPoints: number;
	Costum: boolean;
	Difficulty: TrickDifficulty;
	Types: TrickType[];
}

export interface FullTrick {
	Name: string;
	DefaultPoints: number;
	Costum: boolean;
	Difficulty: TrickDifficulty;
	Spots: Array<{ spot: GeneralSpot; date?: Date }>;
	Types: Array<TrickType>;
}

export interface TrickFromDb {
	Name: string;
	DefaultPoints: number;
	Costum: boolean;
	Difficulty: TrickDifficulty;
	SecondName: string;
	Spot: GeneralSpot;
	Types: TrickType;
}

export interface TrickFromFrontend extends TrickFromDb {
	Name: string;
	DefaultPoints: number;
	Costum: boolean;
	Difficulty: TrickDifficulty;
	SecondName: string;
	Spot: GeneralSpot;
	Type: string | TrickType;
	Date: Date | null;
}
