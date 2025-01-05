"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnorderedTrick = exports.Trick = void 0;
var block_1 = require("./block");
var word_1 = require("./word");
var Trick = (function () {
    function Trick(parts, spot) {
        var idxFirstBlock;
        for (var i = 0; i < parts.length; i++) {
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
    Trick.prototype.assertBlockFound = function (idxFirstBlock) {
        if (typeof idxFirstBlock == 'undefined') {
            throw new Error('Trick cannot be initialized because the given Array<TrickPart> has no Blocks');
        }
    };
    Trick.prototype.calculatePoints = function () {
        var points = 0;
        for (var i = this.idxFirstBlock; i < this.parts.length; i++) {
            var part = this.parts[i];
            points += part.getPoints();
            if (i != this.parts.length - 1) {
                points += this.parts[i + 1].getPercentageBefore() * points;
            }
        }
        ;
        for (var i = this.idxFirstBlock - 1; i >= 0; i--) {
            points += this.parts[i].getPercentageAfter() * points;
        }
        return (points + points * this.spot);
    };
    Trick.prototype.getPoints = function () {
        return this.points;
    };
    Trick.prototype.printToConsole = function () {
        console.log('---------------- TRICK ----------------');
        for (var _i = 0, _a = this.parts; _i < _a.length; _i++) {
            var part = _a[_i];
            if (part.isWord()) {
                console.log("    Word --> Points: " + part.getPoints());
            }
            else {
                console.log("    Block --> Points: " + part.getPoints());
            }
        }
        console.log('\n    Total Points: ' + this.getPoints());
        console.log('---------------------------------------\n');
    };
    return Trick;
}());
exports.Trick = Trick;
var UnorderedTrick = (function () {
    function UnorderedTrick(parts, spot) {
        this.parts = parts;
        this.spot = spot;
    }
    UnorderedTrick.prototype.toWords = function () {
        var array = [];
        for (var _i = 0, _a = this.parts; _i < _a.length; _i++) {
            var part = _a[_i];
            array.push(new word_1.Word(part));
        }
        return array;
    };
    UnorderedTrick.prototype.toTrick = function () {
        var words = this.toWords();
        var trickParts = [];
        var blockWords = [];
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
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
        for (var _a = 0, blockWords_1 = blockWords; _a < blockWords_1.length; _a++) {
            var blockWord = blockWords_1[_a];
            trickParts.push(blockWord);
        }
        return new Trick(trickParts, this.spot);
    };
    return UnorderedTrick;
}());
exports.UnorderedTrick = UnorderedTrick;
//# sourceMappingURL=trick.js.map