"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Word = void 0;
const list = require("./words.json");
class Word {
    word;
    points = 0;
    percentageBefore = 0;
    percentageAfter = 0;
    connect = false;
    applyToWhole = false;
    constructor(word) {
        this.word = word;
        for (const w of list.words) {
            if (word === w.word) {
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
    getPercentageBefore() {
        return this.percentageBefore;
    }
    getPercentageAfter() {
        return this.percentageAfter;
    }
    getPoints() {
        return this.points;
    }
    isWord() {
        return true;
    }
    isBlock() {
        return false;
    }
    containsWord(word) {
        return this.word === word;
    }
    getWords() {
        return [this.word];
    }
}
exports.Word = Word;
//# sourceMappingURL=word.js.map