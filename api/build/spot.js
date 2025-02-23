"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spot = void 0;
var Spot;
(function (Spot) {
    Spot[Spot["Flat"] = 0] = "Flat";
    Spot[Spot["IntoBank"] = 1] = "IntoBank";
    Spot[Spot["DropIn"] = 2] = "DropIn";
    Spot[Spot["Air"] = 3] = "Air";
    Spot[Spot["Flyout"] = 4] = "Flyout";
    Spot[Spot["OffLedge"] = 5] = "OffLedge";
})(Spot || (exports.Spot = Spot = {}));
(function (Spot) {
    function getPercentage(spot) {
        switch (spot) {
            case Spot.Flat: return 0.5;
            case Spot.IntoBank: return 0.3;
            case Spot.DropIn: return 0.2;
            case Spot.Air: return 0.0;
            case Spot.Flyout: return 0.0;
            case Spot.OffLedge: return 0.3;
        }
    }
    Spot.getPercentage = getPercentage;
    function getMaximumPercentage(spots) {
        let max_perc = 0.0;
        spots.forEach(s => {
            if (Spot.getPercentage(s) > max_perc) {
                max_perc = Spot.getPercentage(s);
            }
        });
        return max_perc;
    }
    Spot.getMaximumPercentage = getMaximumPercentage;
})(Spot || (exports.Spot = Spot = {}));
//# sourceMappingURL=spot.js.map