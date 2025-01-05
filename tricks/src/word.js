"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Word = void 0;
var list = require("./words.json");
var Word = (function () {
    function Word(word) {
        var _a, _b, _c, _d, _e;
        this.points = 0;
        this.percentageBefore = 0;
        this.percentageAfter = 0;
        this.connect = false;
        this.applyToWhole = false;
        this.word = word;
        for (var _i = 0, _f = list.words; _i < _f.length; _i++) {
            var w = _f[_i];
            if (word === w.word) {
                this.points = (_a = w.points) !== null && _a !== void 0 ? _a : 0;
                this.percentageAfter = (_b = w.percentageAfter) !== null && _b !== void 0 ? _b : 0;
                this.percentageBefore = (_c = w.percentageBefore) !== null && _c !== void 0 ? _c : 0;
                this.connect = (_d = w.connect) !== null && _d !== void 0 ? _d : false;
                this.applyToWhole = (_e = w.applyToWhole) !== null && _e !== void 0 ? _e : false;
                return;
            }
        }
        console.warn("Unrecognised word: " + word);
    }
    Word.prototype.getPercentageBefore = function () {
        return this.percentageBefore;
    };
    Word.prototype.getPercentageAfter = function () {
        return this.percentageAfter;
    };
    Word.prototype.getPoints = function () {
        return this.points;
    };
    Word.prototype.isWord = function () {
        return true;
    };
    Word.prototype.isBlock = function () {
        return false;
    };
    return Word;
}());
exports.Word = Word;
//# sourceMappingURL=word.js.map