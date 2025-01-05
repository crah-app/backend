import { Trick, UnorderedTrick } from './trick';
import { Spot } from './spot';

let tests: Array<UnorderedTrick> = [
    new UnorderedTrick(["fakie","double", "whip"], Spot.Flat),
    new UnorderedTrick(["crossfoot","bar", "whip"], Spot.Air),
    new UnorderedTrick(["bri","twist"], Spot.Flat),
    new UnorderedTrick(["double","whip", "finger"], Spot.DropIn),
    new UnorderedTrick(["whip", "finger"], Spot.Flat),
    new UnorderedTrick(["double", "whip", "rotor", "twist"], Spot.OffLedge),
    new UnorderedTrick(["360", "whip", "whip", "dono"], Spot.IntoBank),
    new UnorderedTrick(["360", "bri", "whip", "crossfoot"], Spot.Flat),
    new UnorderedTrick(["360", "front scooter", "flip"], Spot.Flyout),
    new UnorderedTrick(["heel", "trivago"], Spot.OffLedge),
    new UnorderedTrick(["mc", "fingerblast", "twist"], Spot.Flyout),
    new UnorderedTrick(["corona", "cup"], Spot.Flat),
    new UnorderedTrick(["front scooter", "cup"], Spot.Flat),
    new UnorderedTrick(["back scooter", "cup"], Spot.Flat),
    new UnorderedTrick(["kickless", "dono"], Spot.Air),
    new UnorderedTrick(["kickless", "bri"], Spot.Flat),
    new UnorderedTrick(["360", "whip", "buttercup"], Spot.Flat),
    new UnorderedTrick(["crossfoot", "360", "whip", "buttercup"], Spot.Flat),
    new UnorderedTrick(["360", "whip", "buttercup", "crossfoot"], Spot.Flat),
    new UnorderedTrick(["crossfoot", "360", "whip", "buttercup", "crossfoot"], Spot.Flat),
    new UnorderedTrick(["bri", "scooterfakie"], Spot.Flat),
    new UnorderedTrick(["full", "cab", "bri"], Spot.Flat),
    new UnorderedTrick(["360", "bri"], Spot.Flat),
    new UnorderedTrick(["half", "cab", "bri"], Spot.Flat),
    new UnorderedTrick(["heel", "rewind"], Spot.Flat),
];


tests.forEach(un_trick => {
    un_trick.toTrick().printToConsole();
});
