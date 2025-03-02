// The Rank is attributed to the User based on the
// sum of the five tricks with most points. Not the pinnedtricks
export enum Rank {
	Iron,
	Bronze,
	Silver,
	Gold,
	Platinum,
	Diamond
}

export namespace Rank {
	
	export function getRank(points: number): Rank {
		if(points > 10000) return Rank.Diamond;
		if(points > 7000) return Rank.Platinum;
		if(points > 5000) return Rank.Gold;
		if(points > 3000) return Rank.Silver;
		if(points > 2000) return Rank.Bronze;
		return Rank.Iron;
	}
}
