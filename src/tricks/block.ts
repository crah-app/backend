import { TrickPart } from './trick';
import { Word } from './word';

export class Block implements TrickPart {
    words: Array<Word>;
    points: number;

    constructor(words: Array<Word>) {
        this.words = words;
        let points = words[words.length-1].getPoints();
        if (points != 0){
            let points: number = words[words.length-1].getPoints();

            let i = (words.length-1);

            for(i; i >= 0; i--) {
                points += (words[i].percentageAfter * points);
            }

            this.points = points;
        } else {
            throw new Error('Block doesn\'t contain any word with points')
        }
    }

    getPercentageBefore(): number {
        return this.words[this.words.length-1].percentageBefore;
    }

    getPercentageAfter(): number {
        return 0;
    }

    getPoints(): number {
        return this.points;
    }

    isWord(): boolean {
        return false;
    }

    isBlock(): boolean {
        return true;
    }

	containsWord(word: string): boolean {
		this.words.forEach(p => {
			if (p.containsWord(word)) return true;
		});
		return false;
	}

	getWords(): Array<string> {
		return this.words.map(w => w.word);
	}
}
