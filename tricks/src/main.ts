import { Trick, UnorderedTrick } from './trick';

let tests: Array<UnorderedTrick> = [
    new UnorderedTrick(["fakie","double", "whip"]),
    new UnorderedTrick(["crossfoot","bar", "whip"]),
    new UnorderedTrick(["bri","twist"]),
    new UnorderedTrick(["double","whip", "finger"]),
    new UnorderedTrick(["whip", "finger"]),
    new UnorderedTrick(["double", "whip", "rotor", "twist"]),
    new UnorderedTrick(["360", "whip", "whip", "dono"]),
    new UnorderedTrick(["360", "bri", "whip", "crossfoot"]),
    new UnorderedTrick(["360", "front scooter", "flip"]),
    new UnorderedTrick(["heel", "trivago"]),
    new UnorderedTrick(["mc", "fingerblast", "twist"]),
    new UnorderedTrick(["corona", "cup"]),
    new UnorderedTrick(["front scooter", "cup"]),
    new UnorderedTrick(["back scooter", "cup"]),
    new UnorderedTrick(["kickless", "dono"]),
    new UnorderedTrick(["kickless", "bri"]),
    new UnorderedTrick(["360", "whip", "buttercup"]),
    new UnorderedTrick(["crossfoot", "360", "whip", "buttercup"]),
    new UnorderedTrick(["360", "whip", "buttercup", "crossfoot"]),
    new UnorderedTrick(["crossfoot", "360", "whip", "buttercup", "crossfoot"]),
    new UnorderedTrick(["bri", "scooterfakie"]),
    new UnorderedTrick(["full", "cab", "bri"]),
    new UnorderedTrick(["360", "bri"]),
    new UnorderedTrick(["half", "cab", "bri"]),
    new UnorderedTrick(["heel", "rewind"]),
];


tests.forEach(un_trick => {
    un_trick.toTrick().printToConsole();
});
