"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trick_1 = require("./trick");
const trickList_1 = require("./trickList");
const spot_1 = require("./spot");
let tests = [
    new trick_1.TrickDescription(["fakie", "double", "whip"], [spot_1.Spot.Flat], new Date("2019-10-20")),
    new trick_1.TrickDescription(["crossfoot", "bar", "whip"], [spot_1.Spot.Air, spot_1.Spot.Flat], new Date("2020-12-20")),
    new trick_1.TrickDescription(["whip", "bar", "whip"], [spot_1.Spot.Air, spot_1.Spot.Flat], new Date("2021-12-20")),
    new trick_1.TrickDescription(["bri", "whip"], [spot_1.Spot.Air, spot_1.Spot.Flat], new Date("2022-12-20")),
    new trick_1.TrickDescription(["360", "bri", "whip", "crossfoot"], [spot_1.Spot.Flat], new Date("2021-12-20T03:24:00")),
    new trick_1.TrickDescription(["mc", "fingerblast", "twist"], [spot_1.Spot.Flyout], new Date("2021-12-20T03:24:00")),
    new trick_1.TrickDescription(["360", "whip", "buttercup"], [spot_1.Spot.Flat], new Date("2021-12-20T03:24:00")),
];
let tricklist = new trickList_1.TrickList(new trickList_1.TrickListDescription(tests, [1, 3, 4]));
tricklist.sortByDateAsc();
tricklist.tricks.forEach((t) => {
    t.printToConsole();
});
console.log(tricklist.getUserRank());
//# sourceMappingURL=main.js.map