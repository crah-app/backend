import { TrickPart } from './trick.js';
import list = require('./../../public/tricks/words.json');
import { TrickType } from '../types/tricklogic.js';

export class Word implements TrickPart {
	word: string;
	points: number = 0;
	percentageBefore: number = 0;
	percentageAfter: number = 0;
	connect: boolean = false;
	applyToWhole: boolean = false;
	type?: TrickType;
	unrecognizedWord?: string | null;

	constructor(word: string) {
		this.word = word.toLowerCase();

		for (const w of list.words) {
			if (word.toLowerCase() === w.word.toLowerCase()) {
				this.points = w.points ?? 0;
				this.percentageAfter = w.percentageAfter ?? 0;
				this.percentageBefore = w.percentageBefore ?? 0;
				this.connect = w.connect ?? false;
				this.applyToWhole = w.applyToWhole ?? false;
				if (w.type) this.type = TrickType[w.type as keyof typeof TrickType];
				return;
			}
		}

		console.warn('Unrecognised word: ' + word, word.toLowerCase());
		this.unrecognizedWord = word;
	}

	isWordUnrecognized(): string | undefined | null {
		return this.unrecognizedWord;
	}

	getPercentageBefore(): number {
		return this.percentageBefore;
	}

	getPercentageAfter(): number {
		return this.percentageAfter;
	}

	getPoints(): number {
		return this.points;
	}

	isWord(): boolean {
		return true;
	}

	isBlock(): boolean {
		return false;
	}

	containsWord(word: string): boolean {
		return this.word === word;
	}

	getWords(): Array<string> {
		return [this.word];
	}
}
