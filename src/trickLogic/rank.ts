// The Rank is attributed to the User based on the
// sum on his 5 best tricks overall. Not his pinnedtricks
export enum Rank {
	Wood, // 0
	Bronze, // 1
	Silver, // 2
	Gold, // 3
	Platinum, // 4
	Diamond, // 5
	Legendary, // 6
}

export namespace Rank {
	export function getRank(points: number): Rank {
		if (points > 4000) return Rank.Legendary;
		if (points > 2000) return Rank.Diamond;
		if (points > 1000) return Rank.Platinum;
		if (points > 500) return Rank.Gold;
		if (points > 300) return Rank.Silver;
		if (points > 200) return Rank.Bronze;
		return Rank.Wood;
	}

	export function getRankIndexByName(rank: string): number {
		switch (rank) {
			case 'Wood':
				return Rank.Wood;
			case 'Bronze':
				return Rank.Bronze;
			case 'Silver':
				return Rank.Silver;
			case 'Gold':
				return Rank.Gold;
			case 'Platinum':
				return Rank.Platinum;
			case 'Diamond':
				return Rank.Diamond;
			case 'Legendary':
				return Rank.Legendary;
			default:
				return Rank.Wood;
		}
	}
}
