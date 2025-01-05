"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
var Block = (function () {
    function Block(words) {
        this.words = words;
        var points = words[words.length - 1].getPoints();
        if (points != 0) {
            var points_1 = words[words.length - 1].getPoints();
            var i = (words.length - 1);
            for (i; i >= 0; i--) {
                points_1 += (words[i].percentageAfter * points_1);
            }
            this.points = points_1;
        }
        else {
            throw new Error('Block doesn\'t contain any word with points');
        }
    }
    Block.prototype.getPercentageBefore = function () {
        return this.words[this.words.length - 1].percentageBefore;
    };
    Block.prototype.getPercentageAfter = function () {
        return 0;
    };
    Block.prototype.getPoints = function () {
        return this.points;
    };
    Block.prototype.isWord = function () {
        return false;
    };
    Block.prototype.isBlock = function () {
        return true;
    };
    return Block;
}());
exports.Block = Block;
//# sourceMappingURL=block.js.map