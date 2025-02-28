import { Block } from "./block.js";
import { Word } from "./word.js";
import { Spot } from "./spot.js";

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
}

export class Trick {
  name: string;
  spots: Array<Spot>;
  date?: Date;
  points: number;

  constructor(description: TrickDescription) {
	let words: Array<Word> = description.toWords();
    let trickParts: Array<TrickPart> = [];
    let blockWords: Array<Word> = [];

    for (const word of words) {
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
    this.date = description.date;
    this.spots = description.spots;
    this.name = description.parts.join(" ");
    this.points = this.calculatePoints(trickParts, this.spots, idxFirstBlock);
  }

  private assertBlockFound(
    idxFirstBlock: number | undefined,
  ): asserts idxFirstBlock is number {
    if (typeof idxFirstBlock == "undefined") {
      throw new Error(
        "Trick cannot be initialized because the given Array<TrickPart> has no Blocks",
      );
    }
  }

  private calculatePoints(parts: Array<TrickPart>, spots: Array<Spot>, idxFirstBlock: Idx): number {
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

    return points + points * Spot.getMaximumPercentage(spots);
  }

  getPoints(): number {
    return this.points;
  }

  landedAtSpot(spot: Spot): boolean {
	  return this.spots.includes(spot);
  }
  
  printToConsole(): void {
    console.log("---------------- TRICK ----------------");
    console.log(this.getName());
    console.log(this.spots.map(s => Spot[s]));
    console.log("\n    Total Points: " + this.getPoints());
    console.log("---------------------------------------\n");
  }

  toTrick(): Trick {
    return this;
  }

  getName(): string {
  	return this.name;
  }
}

export class TrickDescription {
  parts: Array<string>;
  spots: Array<Spot>;
  date?: Date;

  constructor(parts: Array<string>, spots: Array<Spot>, date?: Date) {
    this.parts = parts;
    this.spots = spots;
    this.date = date;
  }

  toWords(): Array<Word> {
    let array: Array<Word> = [];
    for (const part of this.parts) {
      array.push(new Word(part));
    }
    return array;
  }
}


