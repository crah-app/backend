import { Trick, TrickDescription } from "./trick";
import { TrickList, TrickListDescription } from "./trickList";
import { Spot } from "./spot";

let tests: Array<TrickDescription> = [
  new TrickDescription(["fakie", "double", "whip"], [Spot.Flat], new Date("2019-10-20")),
  new TrickDescription(["crossfoot", "bar", "whip"], [Spot.Air, Spot.Flat], new Date("2020-12-20")),
  new TrickDescription(["whip", "bar", "whip"], [Spot.Air, Spot.Flat], new Date("2021-12-20")),
  new TrickDescription(["bri", "whip"], [Spot.Air, Spot.Flat], new Date("2022-12-20")),
  //new TrickDescription(["bar", "whip", "crossfoot"], [Spot.Flat, Spot.DropIn], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["double", "whip", "bar"], [Spot.OffLedge], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["bri", "twist"], [Spot.Flat, Spot.OffLedge], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["double", "whip", "finger"], [Spot.DropIn, Spot.IntoBank], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["whip", "finger"], [Spot.Flat], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["double", "whip", "rotor", "twist"], [Spot.OffLedge], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["360", "whip", "whip", "dono"], [Spot.IntoBank], new Date("2021-12-20T03:24:00")),
  new TrickDescription(["360", "bri", "whip", "crossfoot"], [Spot.Flat], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["360", "front scooter", "flip"], [Spot.Flyout], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["heel", "trivago"], [Spot.OffLedge], new Date("2021-12-20T03:24:00")),
  new TrickDescription(["mc", "fingerblast", "twist"], [Spot.Flyout], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["corona", "cup"], [Spot.Flat], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["front scooter", "cup"], [Spot.Flat], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["back scooter", "cup"], [Spot.Flat], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["kickless", "dono"], [Spot.Air], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["kickless", "bri"], [Spot.Flat], new Date("2021-12-20T03:24:00")),
  new TrickDescription(["360", "whip", "buttercup"], [Spot.Flat], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["crossfoot", "360", "whip", "buttercup"], [Spot.Flat], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["360", "whip", "buttercup", "crossfoot"], [Spot.Flat], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["crossfoot", "360", "whip", "buttercup", "crossfoot"],[Spot.Flat], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["bri", "scooterfakie"], [Spot.Flat], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["full", "cab", "bri"], [Spot.Flat], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["360", "bri"], [Spot.Flat], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["half", "cab", "bri"], [Spot.Flat], new Date("2021-12-20T03:24:00")),
  //new TrickDescription(["heel", "rewind"], [Spot.Flat], new Date("2021-12-20T03:24:00")),
];

let tricklist = new TrickList(new TrickListDescription(tests, [1,3,4]));

tricklist.sortByDateAsc();

tricklist.tricks.forEach((t) => {
  t.printToConsole();
});

console.log(tricklist.getUserRank());

//tricklist.getTopFiveTricks().forEach(i => {
//	console.log(tricklist.getTrick(i).printToConsole());
//});

//console.log("Did this guy land double whip bar?");
//console.log(tricklist.findByName("double whip bar"));
//console.log("Did this guy land double whip bar FLAT?");
//console.log("IDX: " + tricklist.findByNameAndSpot("double whip bar", Spot.Flat));
