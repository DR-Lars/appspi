export type CardKind = 'persoon' | 'voorwerp' | 'locatie';

export const CARD_KINDS: CardKind[] = ['persoon', 'voorwerp', 'locatie'];

export const KIND_LABELS: Record<CardKind, { single: string; plural: string }> = {
	persoon: { single: 'Persoon', plural: 'Personen' },
	voorwerp: { single: 'Voorwerp', plural: 'Voorwerpen' },
	locatie: { single: 'Locatie', plural: 'Locaties' }
};

/** Een kaart in de vaste catalogus (sjabloon voor nieuwe mysteries). */
export class ClueCard {
	constructor(
		public readonly id: number,
		public readonly kind: CardKind,
		public readonly name: string,
		public readonly active: boolean
	) {}

	static isKind(value: string): value is CardKind {
		return (CARD_KINDS as string[]).includes(value);
	}

	toJSON() {
		return { id: this.id, kind: this.kind, name: this.name, active: this.active };
	}
}

/** Een kaart zoals ze in één specifiek mysterie zit (kopie, kan uitgesloten worden). */
export interface MysteryCard {
	id: number;
	kind: CardKind;
	name: string;
	isMember: boolean;
	eliminatedAt: string | null;
}
