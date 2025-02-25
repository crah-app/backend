"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrickDescription = exports.Trick = void 0;
const block_1 = require("./block");
const word_1 = require("./word");
const spot_1 = require("./spot");
class Trick {
    name;
    spots;
    date;
    points;
    constructor(description) {
        let words = description.toWords();
        let trickParts = [];
        let blockWords = [];
        for (const word of words) {
            if (word.applyToWhole) {
                trickParts.push(word);
            }
            else {
                blockWords.push(word);
                if (word.getPoints() != 0) {
                    trickParts.push(new block_1.Block(blockWords));
                    blockWords = [];
                }
            }
        }
        for (const blockWord of blockWords) {
            trickParts.push(blockWord);
        }
        let idxFirstBlock;
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
    assertBlockFound(idxFirstBlock) {
        if (typeof idxFirstBlock == "undefined") {
            throw new Error("Trick cannot be initialized because the given Array<TrickPart> has no Blocks");
        }
    }
    calculatePoints(parts, spots, idxFirstBlock) {
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
        return points + points * spot_1.Spot.getMaximumPercentage(spots);
    }
    getPoints() {
        return this.points;
    }
    landedAtSpot(spot) {
        return this.spots.includes(spot);
    }
    printToConsole() {
        console.log("---------------- TRICK ----------------");
        console.log(this.getName());
        console.log(this.spots.map(s => spot_1.Spot[s]));
        console.log("\n    Total Points: " + this.getPoints());
        console.log("---------------------------------------\n");
    }
    toTrick() {
        return this;
    }
    getName() {
        return this.name;
    }
}
exports.Trick = Trick;
class TrickDescription {
    parts;
    spots;
    date;
    constructor(parts, spots, date) {
        this.parts = parts;
        this.spots = spots;
        this.date = date;
    }
    toWords() {
        let array = [];
        for (const part of this.parts) {
            array.push(new word_1.Word(part));
        }
        return array;
    }
}
exports.TrickDescription = TrickDescription;
//# sourceMappingURL=trick.js.map