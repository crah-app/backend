import { Trick, TrickDescription, Idx } from "./trick.js";
import { Rank } from "./rank.js";
import { Spot } from "./spot.js";

export type TopFiveTricks = Array<Idx>;
export type PinnedTricks = Array<Idx>;

export class TrickListDescription {
	tricks: Array<TrickDescription>;
	pinnedTricks: PinnedTricks;

	private assertPinnedTricksIsValid(pinnedTricks: PinnedTricks) {
		if (pinnedTricks.length > 5) {
			throw new Error("PinnedTricks array contains more than 5 idxs!");
		}
	}

	constructor(tricks: Array<TrickDescription>, pinnedTricks: PinnedTricks) {
		this.tricks = tricks;
		this.assertPinnedTricksIsValid(pinnedTricks);
		this.pinnedTricks = pinnedTricks;
	}
}

// Every tricklist contains atleast one trick.
// If it doesn't contain any, then it isn't created in the first place.
export class TrickList {
  tricks: Array<Trick>;
  pinnedTricks: PinnedTricks;
  
  constructor(description: TrickListDescription) {
    let tricks: Array<Trick> = description.tricks.map((t) => new Trick(t));
    this.tricks = tricks;
    this.pinnedTricks = description.pinnedTricks;
  }
	
  getUserRank(): Rank {
	let topFiveTricks = this.getTopFiveTricksWithPoints();
	let totalPoints = 0;
	topFiveTricks.forEach(([idx, points]) => {
		totalPoints += points;
	});
	
	return Rank.getRank(totalPoints);
  }
  
  findByNameAndSpot(name: string, spot: Spot): Idx | undefined {
	let idx: Idx | undefined = this.findByName(name);

	if(idx !== undefined) {
		if (this.tricks[idx as number].landedAtSpot(spot)) {
			return idx;
		}
	}
  }

  findByName(name: string): Idx | undefined {
	let idx: Idx = this.tricks.findIndex(t => t.name === name);
	if(idx !== -1) return idx;
  }

  getTrick(idx: Idx): Trick {
	return this.tricks[idx];
  }

  getTotalPoints(): number {
	let points: number = 0;
	this.tricks.forEach(t => {
		points += t.points;
	});
	return points;
  }
  
  private sortByDateDisCriterion(a: Trick, b: Trick): number {
	  if(a.date ?? new Date("0000-01-01") > (b.date ?? new Date("0000-01-01"))) return -1;
	  return 1;
  }

  private sortByDateAscCriterion(a: Trick, b: Trick): number {
	  if(a.date ?? new Date("0000-01-01") > (b.date ?? new Date("0000-01-01"))) return 1;
	  return -1;
  }
  
  // latest first, oldest last
  sortByDateDis() {
	  this.tricks.sort((a, b) => this.sortByDateDisCriterion(a,b));
  }
  
  // oldest first, latest last
  sortByDateAsc() {
	  this.tricks.sort((a, b) => this.sortByDateAscCriterion(a,b));
  }
  
  // sorting in discendent order e.g [3400, 3200, 3000, ... ]
  sortByPointsDis() {
	this.tricks.sort((a, b) => b.points - a.points);
  }
  
  // sorting in ascendent order e.g [2800, 3000, 3200, ... ]
  sortByPointsAsc() {
	this.tricks.sort((a, b) => a.points - b.points);
  }
  
  // many copies and complex operations, may be rewritten better
  // Returns the five tricks with most points in ascending order
   private getTopFiveTricksWithPoints(): Array<[number, number]> {
	 let topFiveTricks: Array<[number, number]> = [];
	 let sortedTricks = this.tricks.toSorted((a, b) => b.points - a.points);
	 sortedTricks.length = 5;
	 
	 for(let i = 0; i < this.tricks.length; i++) {
		if(sortedTricks.includes(this.getTrick(i))) {
			topFiveTricks.push([i, this.getTrick(i).getPoints()]);
		}
	 }
	 
	 return topFiveTricks;
   }
   
   getTopFiveTricks(): TopFiveTricks {
	   let topFiveTricks: Array<[number, number]> = this.getTopFiveTricksWithPoints();
	   let topFiveTricksFlattened = topFiveTricks.sort((a,b) => b[1] - a[1]).flat();
	 
		let deletedCount = 0;
		for(let i = 0; i<10; i++) {
			if(i % 2 !== 0) {
				topFiveTricksFlattened.splice(i - deletedCount, 1);
				deletedCount += 1;
			}
		}
		
		return topFiveTricksFlattened;
	}

  getPinnedTricks(): PinnedTricks {
	return this.pinnedTricks;
  }

  push(trick: Trick): Error | void {
	if(this.findByName(trick.getName()) === undefined) {
		this.tricks.push(trick);
		return;
	}
  	throw new Error("Trick " + trick.getName() + "already present in the list");
  }
}
