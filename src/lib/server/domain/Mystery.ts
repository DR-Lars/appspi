import { DomainError } from './DomainError';
import type { CardKind, MysteryCard } from './ClueCard';

export type MysteryStatus = 'concept' | 'actief' | 'opgelost' | 'gesloten';

export interface Hint {
	id: number;
	position: number;
	text: string;
	cardId: number | null;
	releasedAt: string | null;
}

export interface Accusation {
	personId: number;
	objectId: number;
	locationId: number;
}

export interface Guess extends Accusation {
	id: number;
	userId: number;
	displayName: string;
	text: string;
	correct: boolean;
	createdAt: string;
}

/**
 * Aggregaat: een Cluedo-mysterie met kaarten, hints en beschuldigingen.
 * De oplossing is één persoon + één voorwerp + één locatie uit de eigen kaarten.
 */
export class Mystery {
	constructor(
		public readonly id: number,
		public readonly title: string,
		public readonly story: string,
		public readonly status: MysteryStatus,
		public readonly maxGuesses: number,
		public readonly winnerId: number | null,
		public readonly winnerName: string | null,
		public readonly startedAt: string | null,
		public readonly endedAt: string | null,
		public readonly cards: MysteryCard[],
		private readonly solution: Accusation | null,
		public readonly hints: Hint[],
		public readonly guesses: Guess[]
	) {}

	get isActive(): boolean {
		return this.status === 'actief';
	}

	get isFinished(): boolean {
		return this.status === 'opgelost' || this.status === 'gesloten';
	}

	get releasedHints(): Hint[] {
		return this.hints.filter((h) => h.releasedAt !== null);
	}

	get nextHiddenHint(): Hint | undefined {
		return this.hints.find((h) => h.releasedAt === null);
	}

	cardsOf(kind: CardKind): MysteryCard[] {
		return this.cards.filter((c) => c.kind === kind);
	}

	card(id: number | null | undefined): MysteryCard | undefined {
		return id == null ? undefined : this.cards.find((c) => c.id === id);
	}

	isSolutionCard(cardId: number): boolean {
		const s = this.solution;
		return !!s && (s.personId === cardId || s.objectId === cardId || s.locationId === cardId);
	}

	guessesBy(userId: number): Guess[] {
		return this.guesses.filter((g) => g.userId === userId);
	}

	remainingGuessesFor(userId: number): number {
		return Math.max(0, this.maxGuesses - this.guessesBy(userId).length);
	}

	/** Controleert dat de drie kaarten bij dit mysterie en het juiste type horen. */
	assertValidAccusation(a: Accusation): void {
		const checks: [number, CardKind][] = [
			[a.personId, 'persoon'],
			[a.objectId, 'voorwerp'],
			[a.locationId, 'locatie']
		];
		for (const [id, kind] of checks)
			if (this.card(id)?.kind !== kind) throw new DomainError('Kies een persoon, een voorwerp én een locatie.');
	}

	assertCanStart(): void {
		if (this.status !== 'concept') throw new DomainError('Dit mysterie is al gestart.');
		if (!this.solution) throw new DomainError('Er is nog geen oplossing gekozen.');
	}

	assertCanGuess(userId: number): void {
		if (!this.isActive) throw new DomainError('Dit mysterie is niet actief.');
		if (this.remainingGuessesFor(userId) <= 0)
			throw new DomainError('Je hebt geen beschuldigingen meer over voor dit mysterie.');
	}

	isCorrect(a: Accusation): boolean {
		const s = this.solution;
		return !!s && s.personId === a.personId && s.objectId === a.objectId && s.locationId === a.locationId;
	}

	/** "Persoon met het voorwerp in/op locatie" */
	describe(a: Accusation): string {
		return `${this.card(a.personId)?.name ?? '?'} met ${this.card(a.objectId)?.name ?? '?'} — ${this.card(a.locationId)?.name ?? '?'}`;
	}

	/**
	 * Publieke weergave. De oplossing is voor NIEMAND zichtbaar (ook niet voor admins)
	 * zolang het mysterie loopt; pas na afloop wordt ze onthuld.
	 * Admins zien wel hun eigen, nog niet vrijgegeven teksthints.
	 */
	toJSON(forAdmin = false) {
		const reveal = this.isFinished;
		const showHidden = forAdmin || this.isFinished;
		const cardName = (id: number | undefined) => (id == null ? null : (this.card(id)?.name ?? null));
		return {
			id: this.id,
			title: this.title,
			story: this.story,
			status: this.status,
			maxGuesses: this.maxGuesses,
			winnerId: this.winnerId,
			winnerName: this.winnerName,
			startedAt: this.startedAt,
			endedAt: this.endedAt,
			cards: this.cards.map((c) => ({ ...c })),
			solution:
				reveal && this.solution
					? {
							...this.solution,
							person: cardName(this.solution.personId),
							object: cardName(this.solution.objectId),
							location: cardName(this.solution.locationId)
						}
					: null,
			hints: (showHidden ? this.hints : this.releasedHints).map((h) => ({ ...h, cardName: cardName(h.cardId ?? undefined) })),
			totalHints: this.hints.length
		};
	}
}

export type MysteryDTO = ReturnType<Mystery['toJSON']>;
