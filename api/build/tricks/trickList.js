"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrickList = exports.TrickListDescription = void 0;
const trick_1 = require("./trick");
const rank_1 = require("./rank");
class TrickListDescription {
    tricks;
    pinnedTricks;
    assertPinnedTricksIsValid(pinnedTricks) {
        if (pinnedTricks.length > 5) {
            throw new Error("PinnedTricks array contains more than 5 idxs!");
        }
    }
    constructor(tricks, pinnedTricks) {
        this.tricks = tricks;
        this.assertPinnedTricksIsValid(pinnedTricks);
        this.pinnedTricks = pinnedTricks;
    }
}
exports.TrickListDescription = TrickListDescription;
class TrickList {
    tricks;
    pinnedTricks;
    constructor(description) {
        let tricks = description.tricks.map((t) => new trick_1.Trick(t));
        this.tricks = tricks;
        this.pinnedTricks = description.pinnedTricks;
    }
    getUserRank() {
        let topFiveTricks = this.getTopFiveTricksWithPoints();
        let totalPoints = 0;
        topFiveTricks.forEach(([idx, points]) => {
            totalPoints += points;
        });
        return rank_1.Rank.getRank(totalPoints);
    }
    findByNameAndSpot(name, spot) {
        let idx = this.findByName(name);
        if (idx !== undefined) {
            if (this.tricks[idx].landedAtSpot(spot)) {
                return idx;
            }
        }
    }
    findByName(name) {
        let idx = this.tricks.findIndex(t => t.name === name);
        if (idx !== -1)
            return idx;
    }
    getTrick(idx) {
        return this.tricks[idx];
    }
    getTotalPoints() {
        let points = 0;
        this.tricks.forEach(t => {
            points += t.points;
        });
        return points;
    }
    sortByDateDisCriterion(a, b) {
        if (a.date ?? new Date("0000-01-01") > (b.date ?? new Date("0000-01-01")))
            return -1;
        return 1;
    }
    sortByDateAscCriterion(a, b) {
        if (a.date ?? new Date("0000-01-01") > (b.date ?? new Date("0000-01-01")))
            return 1;
        return -1;
    }
    sortByDateDis() {
        this.tricks.sort((a, b) => this.sortByDateDisCriterion(a, b));
    }
    sortByDateAsc() {
        this.tricks.sort((a, b) => this.sortByDateAscCriterion(a, b));
    }
    sortByPointsDis() {
        this.tricks.sort((a, b) => b.points - a.points);
    }
    sortByPointsAsc() {
        this.tricks.sort((a, b) => a.points - b.points);
    }
    getTopFiveTricksWithPoints() {
        let topFiveTricks = [];
        let sortedTricks = this.tricks.toSorted((a, b) => b.points - a.points);
        sortedTricks.length = 5;
        for (let i = 0; i < this.tricks.length; i++) {
            if (sortedTricks.includes(this.getTrick(i))) {
                topFiveTricks.push([i, this.getTrick(i).getPoints()]);
            }
        }
        return topFiveTricks;
    }
    getTopFiveTricks() {
        let topFiveTricks = this.getTopFiveTricksWithPoints();
        let topFiveTricksFlattened = topFiveTricks.sort((a, b) => b[1] - a[1]).flat();
        let deletedCount = 0;
        for (let i = 0; i < 10; i++) {
            if (i % 2 !== 0) {
                topFiveTricksFlattened.splice(i - deletedCount, 1);
                deletedCount += 1;
            }
        }
        return topFiveTricksFlattened;
    }
    getPinnedTricks() {
        return this.pinnedTricks;
    }
    push(trick) {
        if (this.findByName(trick.getName()) === undefined) {
            this.tricks.push(trick);
            return;
        }
        throw new Error("Trick " + trick.getName() + "already present in the list");
    }
}
exports.TrickList = TrickList;
//# sourceMappingURL=trickList.js.map