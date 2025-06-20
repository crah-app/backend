import { GeneralSpot } from '../trickLogic/spot.js';

export enum TrickType {
	Balance, // 0
	Rewind, // 1
	Overhead, // 2
	Grab, // 3
}

export enum TrickDifficulty {
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
