"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rank = void 0;
var Rank;
(function (Rank) {
    Rank[Rank["Iron"] = 0] = "Iron";
    Rank[Rank["Bronze"] = 1] = "Bronze";
    Rank[Rank["Silver"] = 2] = "Silver";
    Rank[Rank["Gold"] = 3] = "Gold";
    Rank[Rank["Platinum"] = 4] = "Platinum";
    Rank[Rank["Diamond"] = 5] = "Diamond";
})(Rank || (exports.Rank = Rank = {}));
(function (Rank) {
    function getRank(points) {
        if (points > 10000)
            return Rank.Diamond;
        if (points > 7000)
            return Rank.Platinum;
        if (points > 5000)
            return Rank.Gold;
        if (points > 3000)
            return Rank.Silver;
        if (points > 2000)
            return Rank.Bronze;
        return Rank.Iron;
    }
    Rank.getRank = getRank;
})(Rank || (exports.Rank = Rank = {}));
//# sourceMappingURL=rank.js.map