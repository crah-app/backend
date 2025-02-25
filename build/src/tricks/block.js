"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
class Block {
    words;
    points;
    constructor(words) {
        this.words = words;
        let points = words[words.length - 1].getPoints();
        if (points != 0) {
            let points = words[words.length - 1].getPoints();
            let i = (words.length - 1);
            for (i; i >= 0; i--) {
                points += (words[i].percentageAfter * points);
            }
            this.points = points;
        }
        else {
            throw new Error('Block doesn\'t contain any word with points');
        }
    }
    getPercentageBefore() {
        return this.words[this.words.length - 1].percentageBefore;
    }
    getPercentageAfter() {
        return 0;
    }
    getPoints() {
        return this.points;
    }
    isWord() {
        return false;
    }
    isBlock() {
        return true;
    }
    containsWord(word) {
        this.words.forEach(p => {
            if (p.containsWord(word))
                return true;
        });
        return false;
    }
    getWords() {
        return this.words.map(w => w.word);
    }
}
exports.Block = Block;
//# sourceMappingURL=block.js.map