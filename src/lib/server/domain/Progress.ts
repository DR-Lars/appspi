import { Money } from './Money';

/** Value object: voortgang van een bedrag tegenover een doel. */
export class Progress {
	constructor(
		public readonly current: Money,
		public readonly target: Money
	) {}

	get percentage(): number {
		return this.current.percentageOf(this.target);
	}

	get remaining(): Money {
		const r = this.target.subtract(this.current);
		return r.cents > 0 ? r : Money.zero();
	}

	get reached(): boolean {
		return this.current.cents >= this.target.cents;
	}

	toJSON() {
		return {
			currentCents: this.current.cents,
			targetCents: this.target.cents,
			remainingCents: this.remaining.cents,
			percentage: Math.round(this.percentage * 10) / 10,
			reached: this.reached
		};
	}
}

export type ProgressDTO = ReturnType<Progress['toJSON']>;
