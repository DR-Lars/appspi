import { Money } from './Money';

export interface Participation {
	userId: number;
	displayName: string;
	share: Money;
}

/**
 * Entiteit: een opbrengst (bv. een verkoopactie of klus) die volledig
 * in de groepspot gaat. Per deelnemer wordt het aandeel bijgehouden.
 */
export class Earning {
	constructor(
		public readonly id: number,
		public readonly title: string,
		public readonly amount: Money,
		public readonly date: string,
		public readonly participants: Participation[],
		public readonly createdByName: string
	) {}

	toJSON() {
		return {
			id: this.id,
			title: this.title,
			amountCents: this.amount.cents,
			date: this.date,
			createdByName: this.createdByName,
			participants: this.participants.map((p) => ({
				userId: p.userId,
				displayName: p.displayName,
				shareCents: p.share.cents
			}))
		};
	}
}
