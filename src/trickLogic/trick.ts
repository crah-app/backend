import { Block } from './block.js';
import { Word } from './word.js';
import { GeneralSpot } from './spot.js';
import { Err, ErrType } from '../constants/errors.js';
import {
	AllTricksData,
	TrickDifficulty,
	TrickType,
} from '../types/tricklogic.js';

export type Idx = number;

export interface TrickPart {
	points: number;
	getPercentageBefore(): number;
	getPercentageAfter(): number;
	getPoints(): number;
	isWord(): boolean;
	isBlock(): boolean;
	containsWord(word: string): boolean;
	getWords(): Array<string>;
	unrecognizedWord?: string | null | undefined;
}

export class Trick {
	Name: string;
	Spots: Array<{ spot: GeneralSpot; date?: Date }>;
	Points: number;
	DefaultPoints: number;
	Types: TrickType[] = [];
	Costum: boolean;
	Difficulty: TrickDifficulty;
	unrecognizedWord: string | null | undefined;

	constructor(description: TrickDescription, allTricksData?: AllTricksData) {
		this.Name = description.parts.join(' ');
		this.Spots = description.spots;

		// default
		this.Costum = false;

		// if trick already exists
		if (allTricksData !== undefined) {
			this.DefaultPoints = allTricksData.DefaultPoints;
			this.Points =
				allTricksData.DefaultPoints +
				allTricksData.DefaultPoints *
					GeneralSpot.getMaximumPercentage(description.spots);

			this.Costum = allTricksData.Costum;
			this.Difficulty = allTricksData.Difficulty;
			return;
		}

		let words: Array<Word> = description.toWords();

		// if parameter "unrecognizedWord" is a string value (the word itself) that means this word in unknown.
		// Thus the trick evaluation process must abort
		this.unrecognizedWord =
			words.find((word) => typeof word.unrecognizedWord === 'string')
				?.unrecognizedWord || null;

		let trickParts: Array<TrickPart> = [];
		let blockWords: Array<Word> = [];

		for (const word of words) {
			if (word.type) this.Types.push(word.type);
			if (word.applyToWhole) {
				trickParts.push(word);
			} else {
				blockWords.push(word);
				if (word.getPoints() != 0) {
					trickParts.push(new Block(blockWords));
					blockWords = [];
				}
			}
		}

		for (const blockWord of blockWords) {
			trickParts.push(blockWord);
		}

		let idxFirstBlock: number | undefined;

		for (let i = 0; i < trickParts.length; i++) {
			if (trickParts[i].isBlock()) {
				idxFirstBlock = i;
				break;
			}
		}

		this.assertBlockFound(idxFirstBlock);
		this.DefaultPoints = this.calculateDefaultPoints(trickParts, idxFirstBlock);
		this.Points =
			this.DefaultPoints +
			this.DefaultPoints * GeneralSpot.getMaximumPercentage(this.Spots);

		this.Difficulty = TrickDifficulty.getDifficultyByPoints(this.Points);
	}

	private assertBlockFound(
		idxFirstBlock: number | undefined,
	): asserts idxFirstBlock is number {
		if (typeof idxFirstBlock == 'undefined') {
			console.warn(
				'Trick cannot be initialized because the given Array<TrickPart> has no Blocks',
			);
			this.unrecognizedWord;
		}
	}

	private calculateDefaultPoints(
		parts: Array<TrickPart>,
		idxFirstBlock: Idx,
	): number {
		let points = 0;

		for (let i = idxFirstBlock; i < parts.length; i++) {
			let part = parts[i];
			points += part.getPoints();
			if (i != parts.length - 1) {
				points += parts[i + 1].getPercentageBefore() * points;
			}
		}

		for (let i = idxFirstBlock - 1; i >= 0; i--) {
			points += parts[i].getPercentageAfter() * points;
		}

		return points;
	}

	getPoints(): number {
		return this.Points;
	}

	landedAtSpot(spot: GeneralSpot): boolean {
		return this.Spots.some((entry) => entry.spot === spot);
	}

	printToConsole(): void {
		console.log('---------------- TRICK ----------------');
		console.log(this.getName());
		console.log(this.Spots.map((s) => GeneralSpot[s.spot]));
		console.log('\n    Total Points: ' + this.getPoints());
		console.log('---------------------------------------\n');
	}

	toTrick(): Trick {
		return this;
	}

	getName(): string {
		return this.Name;
	}

	getDefaultDifficulty(): TrickDifficulty {
		return TrickDifficulty.getDifficultyByPoints(this.DefaultPoints);
	}

	getOldestDate(): Date | undefined {
		let current = this.Spots[0].date;

		this.Spots.forEach((s) => {
			if (current == undefined) current = s.date;

			if (s.date != undefined) {
				if (s.date.getTime() < current!.getTime()) {
					current = s.date;
				}
			}
		});

		return current;
	}

	getLatestDate(): Date | undefined {
		let current = this.Spots[0].date;

		this.Spots.forEach((s) => {
			if (current == undefined) current = s.date;

			if (s.date != undefined) {
				if (s.date.getTime() > current!.getTime()) {
					current = s.date;
				}
			}
		});

		return current;
	}
}

export class TrickDescription {
	parts: Array<string>;
	spots: Array<{ spot: GeneralSpot; date?: Date }>;

	constructor(
		parts: Array<string>,
		spots: Array<{ spot: GeneralSpot; date?: Date }>,
	) {
		this.parts = parts;
		this.spots = spots;
	}

	toWords(): Array<Word> {
		let array: Array<Word> = [];
		for (const part of this.parts) {
			const newWord = new Word(part);
			array.push(newWord);
		}

		return array;
	}
}
