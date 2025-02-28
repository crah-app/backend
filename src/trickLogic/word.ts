import { TrickPart } from './trick.js';
import * as list from "../../public/tricks/words.json" with {type: "json"};

export class Word implements TrickPart {
    word: string;
    points: number = 0;
    percentageBefore: number = 0;
    percentageAfter: number = 0;
    connect: boolean = false;
    applyToWhole: boolean = false;

    constructor(word: string) {
        this.word = word;
        
        for(const w of list.default.words) {
            if(word === w.word) {
                this.points = w.points ?? 0;
                this.percentageAfter = w.percentageAfter ?? 0;
                this.percentageBefore = w.percentageBefore ?? 0; 
                this.connect = w.connect ?? false;
                this.applyToWhole = w.applyToWhole ?? false;
                return;
            }
        }

        console.warn("Unrecognised word: " + word);
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

