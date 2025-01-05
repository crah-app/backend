import { Block } from './block';
import { Word } from './word';
import { Spot } from './spot';

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
    idxFirstBlock: number;
    spot: Spot;
    points: number;

    constructor(parts: Array<TrickPart>, spot: Spot) {
        let idxFirstBlock: number | undefined;
        
        for(let i = 0; i < parts.length; i++) {
            if (parts[i].isBlock()) {
                idxFirstBlock = i;
                break;
            }
        }
        
        this.assertBlockFound(idxFirstBlock);

        this.parts = parts;
        this.spot = spot;
        this.idxFirstBlock = idxFirstBlock;
        this.points = this.calculatePoints();
    }

    private assertBlockFound(idxFirstBlock: number | undefined): asserts idxFirstBlock is number {
        if (typeof idxFirstBlock == 'undefined') {
            throw new Error('Trick cannot be initialized because the given Array<TrickPart> has no Blocks');
        }
    }

    private calculatePoints(): number {
        let points = 0;
        
        for(let i = this.idxFirstBlock; i < this.parts.length; i++) {
            let part = this.parts[i];

            points += part.getPoints();
            if(i != this.parts.length - 1) {
                points += this.parts[i+1].getPercentageBefore() * points;
            }
        };

        for(let i = this.idxFirstBlock - 1; i >= 0; i--) {
            points += this.parts[i].getPercentageAfter() * points;
        }

        return (points + points * this.spot);
    }

    getPoints(): number {
        return this.points;
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
        console.log('\n    Total Points: ' + this.getPoints());
        console.log('---------------------------------------\n');
    }
}


export class UnorderedTrick {
    parts: Array<string>;
    spot: Spot;

    constructor(parts: Array<string>, spot: Spot) {
        this.parts = parts;
        this.spot = spot;
    }
    
    toWords(): Array<Word> {
        let array: Array<Word> = [];
        for(const part of this.parts) {
            array.push(new Word(part));
        }
        return array;
    }

    toTrick(): Trick {
        let words: Array<Word> = this.toWords();
        let trickParts: Array<TrickPart> = [];
        let blockWords: Array<Word> = [];

        for(const word of words){
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

        for(const blockWord of blockWords) {
            trickParts.push(blockWord);
        }

        return new Trick(trickParts, this.spot);
    }
}

