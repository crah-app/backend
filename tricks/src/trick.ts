import { Block } from './block';
import { Word } from './word';

export interface TrickPart {
    points: number;
    getPercentageBefore(): number;
    getPercentageAfter(): number;
    getPoints(): number;
    isWord(): boolean;
    isBlock(): boolean;
}

export class Trick {
    parts: Array<TrickPart>;
    idx_first_block: number;

    constructor(parts: Array<TrickPart>) {
        let idx_first_block: number | undefined;
        
        for(let i = 0; i < parts.length; i++) {
            if (parts[i].isBlock()) {
                idx_first_block = i;
                break;
            }
        }
        
        if (typeof idx_first_block == 'undefined') {
            throw new Error('The Trick object doesn\'t contain any Block');
        }

        this.parts = parts;
        this.idx_first_block = idx_first_block;
    }

    calculatePoints(): number {
        let points = 0;
        
        for(let i = this.idx_first_block; i < this.parts.length; i++) {
            let part = this.parts[i];

            points += part.getPoints();
            if(i != this.parts.length - 1) {
                points += this.parts[i+1].getPercentageBefore() * points;
            }
        };

        for(let i = this.idx_first_block - 1; i >= 0; i--) {
            points += this.parts[i].getPercentageAfter() * points;
        }

        return points;
    }

    printToConsole(): void {
        console.log('---------------- TRICK ----------------');
        for(const part of this.parts) {
            if(part.isWord()) {
                console.log("    Word --> Points: " + part.getPoints());
            } else {
                console.log("    Block --> Points: " + part.getPoints());
            }
        }
        console.log('\n    Total Points: ' + this.calculatePoints());
        console.log('---------------------------------------\n');
    }
}


export class UnorderedTrick {
    parts: Array<string>

    constructor(parts: Array<string>) {
        this.parts = parts;
    }
    
    toWords(): Array<Word> {
        let a: Array<Word> = [];
        for(const part of this.parts) {
            a.push(new Word(part));
        }
        return a;
    }

    toTrick(): Trick {
        let words: Array<Word> = this.toWords();
        let trick_parts: Array<TrickPart> = [];
        let block_words: Array<Word> = [];

        for(const word of words){
            if (word.applyToWhole) {
                trick_parts.push(word);
            } else {
                block_words.push(word);
                if (word.getPoints() != 0) {
                    trick_parts.push(new Block(block_words));
                    block_words = [];
                }
            }
        }

        for(const bw of block_words) {
            trick_parts.push(bw);
        }

        return new Trick(trick_parts);
    }
}