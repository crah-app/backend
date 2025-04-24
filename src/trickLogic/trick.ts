import { Block } from './block.js';
import { Word } from './word.js';
import { Spot } from './spot.js';
import { AllTricksData } from '../middleware/tricks.js';
import { Err, ErrType } from '../constants/errors.js';

export type Idx = number;

export enum TrickType {
	Balance,
	Rewind,
	Overhead,
	Grab
}

export interface TrickPart {
	points: number;
	getPercentageBefore(): number;
	getPercentageAfter(): number;
	getPoints(): number;
	isWord(): boolean;
	isBlock(): boolean;
	containsWord(word: string): boolean;
	getWords(): Array<string>;
}

export class Trick {
	name: string;
	spots: Array<{spot: Spot, date?: Date}>;
	points: number;
	defaultPoints: number;
	types: TrickType[] = [];

	constructor(description: TrickDescription, allTricksData?: AllTricksData) {
		this.name = description.parts.join(" ");
		this.spots = description.spots;
		
		if (allTricksData) {
			this.defaultPoints = allTricksData.defaultPoints;
			this.points = allTricksData.defaultPoints + allTricksData.defaultPoints * Spot.getMaximumPercentage(description.spots);	
			return;
		}
		
		let words: Array<Word> = description.toWords();
		let trickParts: Array<TrickPart> = [];
		let blockWords: Array<Word> = [];

		for (const word of words) {
			if (word.type) this.types.push(word.type);
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
		this.defaultPoints = this.calculateDefaultPoints(trickParts, idxFirstBlock);
		this.points = this.defaultPoints + this.defaultPoints * Spot.getMaximumPercentage(this.spots);
	}

	private assertBlockFound(
		idxFirstBlock: number | undefined,
	): asserts idxFirstBlock is number {
		if (typeof idxFirstBlock == 'undefined') {
			throw new Error(
				'Trick cannot be initialized because the given Array<TrickPart> has no Blocks',
			);
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
		return this.points;
	}

	landedAtSpot(spot: Spot): boolean {
		return this.spots.some(entry => entry.spot === spot);
	}

	printToConsole(): void {
		console.log('---------------- TRICK ----------------');
		console.log(this.getName());
		console.log(this.spots.map((s) => Spot[s.spot]));
		console.log('\n    Total Points: ' + this.getPoints());
		console.log('---------------------------------------\n');
	}

	toTrick(): Trick {
		return this;
	}

	getName(): string {
		return this.name;
	}

	getOldestDate(): Date | undefined {
		let current = this.spots[0].date; 

		this.spots.forEach(s => {
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
		let current = this.spots[0].date; 

		this.spots.forEach(s => {
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
	spots: Array<{spot: Spot, date?: Date}>;

	constructor(parts: Array<string>, spots: Array<{spot: Spot, date?: Date}>) {
		this.parts = parts;
		this.spots = spots;
	}

	toWords(): Array<Word> {
		let array: Array<Word> = [];
		for (const part of this.parts) {
			array.push(new Word(part));
		}
		return array;
	}
}
