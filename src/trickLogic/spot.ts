// The values represent the percentages
export enum Spot {
	Flat,
	IntoBank,
	DropIn,
	Air,
	Flyout,
	OffLedge,
}

export namespace Spot {
	export function getPercentage(spot: Spot): number {
		switch (spot) {
			case Spot.Flat: return 0.5;
			case Spot.IntoBank: return 0.3;
			case Spot.DropIn: return 0.2;
			case Spot.Air: return 0.0;
			case Spot.Flyout: return 0.0;
			case Spot.OffLedge: return 0.3;
		}
	}
	
	export function getMaximumPercentage(spots: Array<{spot:Spot, date?: Date}>): number {
		let max_perc: number = 0.0;
		spots.forEach(s => max_perc = Math.max(max_perc, Spot.getPercentage(s.spot)));
		return max_perc;
	}
}

