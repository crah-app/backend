// The Rank is attributed to the User based on the
// sum on his 5 best tricks overall. Not his pinnedtricks
export enum Rank {
	Wood,
	Bronze,
	Silver,
	Gold,
	Platinum,
	Diamond,
	Legendary,
}

export namespace Rank {
	export function getRank(points: number): Rank {
		if (points > 15000) return Rank.Legendary;
		if (points > 10000) return Rank.Diamond;
		if (points > 7000) return Rank.Platinum;
		if (points > 5000) return Rank.Gold;
		if (points > 3000) return Rank.Silver;
		if (points > 2000) return Rank.Bronze;
		return Rank.Wood;
	}
}
