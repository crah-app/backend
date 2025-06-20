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
			case Spot.Flat:
				return 0.5;
			case Spot.IntoBank:
				return 0.3;
			case Spot.DropIn:
				return 0.2;
			case Spot.Air:
				return 0.0;
			case Spot.Flyout:
				return 0.0;
			case Spot.OffLedge:
				return 0.3;
		}
	}

	export function getMaximumPercentage(
		spots: Array<{ spot: Spot; date?: Date }>,
	): number {
		let max_perc: number = 0.0;
		spots.forEach(
			(s) => (max_perc = Math.max(max_perc, Spot.getPercentage(s.spot))),
		);
		return max_perc;
	}
}

// in the frontend named as `TrickSpot`
export enum GeneralSpot {
	Flat = 'Flat',
	Street = 'Street',
	Park = 'Park',
}

export namespace GeneralSpot {
	export function getPercentage(general_spot: GeneralSpot) {
		switch (general_spot) {
			case GeneralSpot.Park:
				return 0.0;
			case GeneralSpot.Street:
				return 0.3;
			case GeneralSpot.Flat:
				return 0.5;
		}
	}

	export function getMaximumPercentage(
		spots: Array<{ spot: GeneralSpot; date?: Date }>,
	): number {
		let max_perc: number = 0.0;
		spots.forEach(
			(s) => (max_perc = Math.max(max_perc, GeneralSpot.getPercentage(s.spot))),
		);
		return max_perc;
	}
}
