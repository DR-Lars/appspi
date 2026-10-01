import { randomInt } from 'node:crypto';
import { CARD_KINDS, KIND_LABELS, type CardKind } from '../domain/ClueCard';
import { DomainError } from '../domain/DomainError';
import type { Accusation, Mystery } from '../domain/Mystery';
import type { User } from '../domain/User';
import type { ClueCardRepository } from '../repositories/ClueCardRepository';
import type { MysteryRepository } from '../repositories/MysteryRepository';
import type { UserRepository } from '../repositories/UserRepository';

export interface MysteryInput {
	title: string;
	story: string;
	maxGuesses: string | number;
}

/** Spelleiding van het Cluedo-spel: admins sturen, leden beschuldigen. */
export class MysteryService {
	constructor(
		private readonly repo: MysteryRepository,
		private readonly catalog: ClueCardRepository,
		private readonly users: UserRepository
	) {}

	active(): Mystery | null {
		return this.repo.findActive();
	}

	finished(): Mystery[] {
		return this.repo.findFinished();
	}

	all(): Mystery[] {
		return this.repo.findAll();
	}

	get(id: number): Mystery {
		const m = this.repo.findById(id);
		if (!m) throw new DomainError('Mysterie niet gevonden.');
		return m;
	}

	private static validate(input: MysteryInput) {
		const title = input.title.trim();
		const maxGuesses = Number(input.maxGuesses);
		if (!title) throw new DomainError('Geef het mysterie een titel.');
		if (!Number.isInteger(maxGuesses) || maxGuesses < 1 || maxGuesses > 20)
			throw new DomainError('Aantal beschuldigingen per lid moet tussen 1 en 20 liggen.');
		return { title, story: input.story.trim(), maxGuesses };
	}

	/**
	 * Maakt een mysterie aan met alle actieve kaarten uit de catalogus + alle leden als verdachten,
	 * en trekt meteen een willekeurige oplossing.
	 */
	create(input: MysteryInput, admin: User): number {
		MysteryService.assertAdmin(admin);
		const v = MysteryService.validate(input);
		const cards = [
			...this.users.findAll().map((u) => ({ kind: 'persoon' as CardKind, name: u.displayName, isMember: true })),
			...this.catalog.findActive().map((c) => ({ kind: c.kind, name: c.name, isMember: false }))
		];
		for (const kind of CARD_KINDS)
			if (!cards.some((c) => c.kind === kind))
				throw new DomainError(`Er zijn geen actieve ${KIND_LABELS[kind].plural.toLowerCase()} in de kaartenset.`);

		const { id, cardIds } = this.repo.create(v.title, v.story, v.maxGuesses, cards);
		const pick = (kind: CardKind) => {
			const pool = cardIds.filter((c) => c.kind === kind);
			return pool[randomInt(pool.length)]!.id;
		};
		this.repo.setSolution(id, { personId: pick('persoon'), objectId: pick('voorwerp'), locationId: pick('locatie') });
		return id;
	}

	update(id: number, input: MysteryInput, admin: User): void {
		MysteryService.assertAdmin(admin);
		if (this.get(id).isFinished) throw new DomainError('Een afgelopen mysterie kan niet meer aangepast worden.');
		const v = MysteryService.validate(input);
		this.repo.update(id, v.title, v.story, v.maxGuesses);
	}

	/** Blind opnieuw loten: ook de admin ziet de oplossing niet. */
	reroll(id: number, admin: User): void {
		MysteryService.assertAdmin(admin);
		const m = this.assertConcept(id);
		const excluded = new Set(m.hints.map((h) => h.cardId).filter(Boolean));
		const pick = (kind: CardKind) => {
			const pool = m.cardsOf(kind).filter((c) => !excluded.has(c.id));
			if (!pool.length) throw new DomainError(`Alle ${KIND_LABELS[kind].plural.toLowerCase()} worden door hints uitgesloten.`);
			return pool[randomInt(pool.length)]!.id;
		};
		this.repo.setSolution(id, { personId: pick('persoon'), objectId: pick('voorwerp'), locationId: pick('locatie') });
	}

	/** Vrije teksthint (sfeer, verhaal…), later handmatig vrij te geven. */
	addHint(id: number, text: string, admin: User): void {
		MysteryService.assertAdmin(admin);
		const m = this.get(id);
		if (m.isFinished) throw new DomainError('Dit mysterie is afgelopen.');
		const t = text.trim();
		if (!t) throw new DomainError('De hint is leeg.');
		this.repo.addHint(id, t.slice(0, 300), null);
	}

	/**
	 * Automatische hint: het systeem sluit een willekeurige kaart uit die NIET bij de
	 * oplossing hoort en geeft die meteen vrij. Zo kan de admin hints geven zonder
	 * de oplossing te kennen.
	 */
	autoHint(id: number, kind: CardKind | null, admin: User): { name: string } {
		MysteryService.assertAdmin(admin);
		const m = this.get(id);
		if (!m.isActive) throw new DomainError('Start het mysterie eerst.');
		const pool = m.cards.filter((c) => (!kind || c.kind === kind) && !c.eliminatedAt && !m.isSolutionCard(c.id));
		if (!pool.length)
			throw new DomainError(
				kind ? `Er zijn geen ${KIND_LABELS[kind].plural.toLowerCase()} meer om uit te sluiten.` : 'Er zijn geen kaarten meer om uit te sluiten.'
			);
		const card = pool[randomInt(pool.length)]!;
		const hintId = this.repo.addHint(id, MysteryService.defaultHintText(card.kind, card.name), card.id);
		this.repo.releaseHint(id, hintId, card.id);
		return { name: card.name };
	}

	private static defaultHintText(kind: CardKind, name: string): string {
		if (kind === 'persoon') return `${name} heeft een waterdicht alibi.`;
		if (kind === 'voorwerp') return `De ${name.toLowerCase()} werd niet gebruikt.`;
		return `Het gebeurde niet in/op ${name}.`;
	}

	deleteHint(id: number, hintId: number, admin: User): void {
		MysteryService.assertAdmin(admin);
		const hint = this.get(id).hints.find((h) => h.id === hintId);
		if (!hint) throw new DomainError('Hint niet gevonden.');
		if (hint.releasedAt) throw new DomainError('Een vrijgegeven hint kan niet verwijderd worden.');
		this.repo.deleteHint(id, hintId);
	}

	/** Handmatige trigger door een admin: het spel gaat live. */
	start(id: number, admin: User): void {
		MysteryService.assertAdmin(admin);
		this.get(id).assertCanStart();
		if (this.repo.findActive()) throw new DomainError('Er loopt al een ander mysterie. Sluit dat eerst af.');
		this.repo.setStatus(id, 'actief');
	}

	releaseHint(id: number, hintId: number | null, admin: User): void {
		MysteryService.assertAdmin(admin);
		const m = this.get(id);
		if (!m.isActive) throw new DomainError('Start het mysterie eerst.');
		const hint = hintId ? m.hints.find((h) => h.id === hintId && !h.releasedAt) : m.nextHiddenHint;
		if (!hint) throw new DomainError('Er zijn geen verborgen hints meer.');
		this.repo.releaseHint(id, hint.id, hint.cardId);
	}

	/** Een lid beschuldigt iemand. Een juiste beschuldiging lost het mysterie meteen op. */
	accuse(id: number, a: Accusation, user: User): { correct: boolean; text: string } {
		const m = this.get(id);
		m.assertCanGuess(user.id);
		m.assertValidAccusation(a);
		const correct = m.isCorrect(a);
		const text = m.describe(a);
		this.repo.addGuess(id, user.id, a, text, correct);
		if (correct) this.repo.setStatus(id, 'opgelost', user.id);
		return { correct, text };
	}

	close(id: number, admin: User): void {
		MysteryService.assertAdmin(admin);
		if (!this.get(id).isActive) throw new DomainError('Dit mysterie is niet actief.');
		this.repo.setStatus(id, 'gesloten');
	}

	delete(id: number, admin: User): void {
		MysteryService.assertAdmin(admin);
		if (this.get(id).isActive) throw new DomainError('Sluit het mysterie eerst af.');
		this.repo.delete(id);
	}

	private assertConcept(id: number): Mystery {
		const m = this.get(id);
		if (m.status !== 'concept') throw new DomainError('De oplossing kan enkel vóór de start opnieuw geloot worden.');
		return m;
	}

	private static assertAdmin(user: User): void {
		if (!user.isAdmin) throw new DomainError('Enkel admins kunnen het spel leiden.');
	}
}
