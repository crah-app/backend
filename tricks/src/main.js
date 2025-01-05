"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var trick_1 = require("./trick");
var spot_1 = require("./spot");
var tests = [
    new trick_1.UnorderedTrick(["fakie", "double", "whip"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["crossfoot", "bar", "whip"], spot_1.Spot.Air),
    new trick_1.UnorderedTrick(["bri", "twist"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["double", "whip", "finger"], spot_1.Spot.DropIn),
    new trick_1.UnorderedTrick(["whip", "finger"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["double", "whip", "rotor", "twist"], spot_1.Spot.OffLedge),
    new trick_1.UnorderedTrick(["360", "whip", "whip", "dono"], spot_1.Spot.IntoBank),
    new trick_1.UnorderedTrick(["360", "bri", "whip", "crossfoot"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["360", "front scooter", "flip"], spot_1.Spot.Flyout),
    new trick_1.UnorderedTrick(["heel", "trivago"], spot_1.Spot.OffLedge),
    new trick_1.UnorderedTrick(["mc", "fingerblast", "twist"], spot_1.Spot.Flyout),
    new trick_1.UnorderedTrick(["corona", "cup"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["front scooter", "cup"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["back scooter", "cup"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["kickless", "dono"], spot_1.Spot.Air),
    new trick_1.UnorderedTrick(["kickless", "bri"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["360", "whip", "buttercup"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["crossfoot", "360", "whip", "buttercup"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["360", "whip", "buttercup", "crossfoot"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["crossfoot", "360", "whip", "buttercup", "crossfoot"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["bri", "scooterfakie"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["full", "cab", "bri"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["360", "bri"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["half", "cab", "bri"], spot_1.Spot.Flat),
    new trick_1.UnorderedTrick(["heel", "rewind"], spot_1.Spot.Flat),
];
tests.forEach(function (un_trick) {
    un_trick.toTrick().printToConsole();
});
//# sourceMappingURL=main.js.map