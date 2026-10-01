import { BaseRepository } from './BaseRepository';
import type { CardKind, MysteryCard } from '../domain/ClueCard';
import { Mystery, type Accusation, type Guess, type Hint, type MysteryStatus } from '../domain/Mystery';

interface MysteryRow {
	id: number;
	title: string;
	story: string;
	status: MysteryStatus;
	max_guesses: number;
	winner_id: number | null;
	winner_name: string | null;
	started_at: string | null;
	ended_at: string | null;
	solution_person: number | null;
	solution_object: number | null;
	solution_location: number | null;
}

export class MysteryRepository extends BaseRepository {
	private static readonly SELECT = `
		SELECT m.*, u.display_name AS winner_name
		FROM mysteries m LEFT JOIN users u ON u.id = m.winner_id`;

	private hydrate(row: MysteryRow): Mystery {
		const cards = (
			this.db
				.prepare(
					`SELECT * FROM mystery_cards WHERE mystery_id = ?
					 ORDER BY CASE kind WHEN 'persoon' THEN 1 WHEN 'voorwerp' THEN 2 ELSE 3 END, is_member, name COLLATE NOCASE`
				)
				.all(row.id) as { id: number; kind: CardKind; name: string; is_member: number; eliminated_at: string | null }[]
		).map<MysteryCard>((c) => ({
			id: c.id,
			kind: c.kind,
			name: c.name,
			isMember: c.is_member === 1,
			eliminatedAt: c.eliminated_at
		}));

		const hints = (
			this.db.prepare('SELECT * FROM hints WHERE mystery_id = ? ORDER BY position, id').all(row.id) as {
				id: number;
				position: number;
				text: string;
				card_id: number | null;
				released_at: string | null;
			}[]
		).map<Hint>((h) => ({ id: h.id, position: h.position, text: h.text, cardId: h.card_id, releasedAt: h.released_at }));

		const guesses = (
			this.db
				.prepare(
					`SELECT g.*, u.display_name FROM guesses g JOIN users u ON u.id = g.user_id
					 WHERE g.mystery_id = ? ORDER BY g.created_at DESC, g.id DESC`
				)
				.all(row.id) as {
				id: number;
				user_id: number;
				display_name: string;
				text: string;
				correct: number;
				created_at: string;
				person_id: number;
				object_id: number;
				location_id: number;
			}[]
		).map<Guess>((g) => ({
			id: g.id,
			userId: g.user_id,
			displayName: g.display_name,
			text: g.text,
			correct: g.correct === 1,
			createdAt: g.created_at,
			personId: g.person_id,
			objectId: g.object_id,
			locationId: g.location_id
		}));

		const solution =
			row.solution_person && row.solution_object && row.solution_location
				? { personId: row.solution_person, objectId: row.solution_object, locationId: row.solution_location }
				: null;

		return new Mystery(
			row.id,
			row.title,
			row.story,
			row.status,
			row.max_guesses,
			row.winner_id,
			row.winner_name,
			row.started_at,
			row.ended_at,
			cards,
			solution,
			hints,
			guesses
		);
	}

	findById(id: number): Mystery | null {
		const row = this.db.prepare(`${MysteryRepository.SELECT} WHERE m.id = ?`).get(id) as MysteryRow | undefined;
		return row ? this.hydrate(row) : null;
	}

	findActive(): Mystery | null {
		const row = this.db
			.prepare(`${MysteryRepository.SELECT} WHERE m.status = 'actief' ORDER BY m.started_at DESC LIMIT 1`)
			.get() as MysteryRow | undefined;
		return row ? this.hydrate(row) : null;
	}

	findAll(): Mystery[] {
		return (this.db.prepare(`${MysteryRepository.SELECT} ORDER BY m.id DESC`).all() as MysteryRow[]).map((r) =>
			this.hydrate(r)
		);
	}

	findFinished(): Mystery[] {
		return (
			this.db
				.prepare(`${MysteryRepository.SELECT} WHERE m.status IN ('opgelost','gesloten') ORDER BY m.ended_at DESC`)
				.all() as MysteryRow[]
		).map((r) => this.hydrate(r));
	}

	/** Maakt het mysterie + zijn kaarten aan in één transactie. Geeft id's van de kaarten terug. */
	create(
		title: string,
		story: string,
		maxGuesses: number,
		cards: { kind: CardKind; name: string; isMember: boolean }[]
	): { id: number; cardIds: { id: number; kind: CardKind }[] } {
		return this.database.transaction(() => {
			const id = this.lastId(
				this.db
					.prepare("INSERT INTO mysteries (title, story, solution, max_guesses) VALUES (?, ?, '', ?)")
					.run(title, story, maxGuesses)
			);
			const stmt = this.db.prepare('INSERT INTO mystery_cards (mystery_id, kind, name, is_member) VALUES (?, ?, ?, ?)');
			const cardIds = cards.map((c) => ({ id: this.lastId(stmt.run(id, c.kind, c.name, c.isMember ? 1 : 0)), kind: c.kind }));
			return { id, cardIds };
		});
	}

	update(id: number, title: string, story: string, maxGuesses: number): void {
		this.db.prepare('UPDATE mysteries SET title = ?, story = ?, max_guesses = ? WHERE id = ?').run(title, story, maxGuesses, id);
	}

	setSolution(id: number, s: Accusation): void {
		this.db
			.prepare('UPDATE mysteries SET solution_person = ?, solution_object = ?, solution_location = ? WHERE id = ?')
			.run(s.personId, s.objectId, s.locationId, id);
	}

	setStatus(id: number, status: MysteryStatus, winnerId: number | null = null): void {
		const timeCol = status === 'actief' ? 'started_at' : 'ended_at';
		this.db
			.prepare(`UPDATE mysteries SET status = ?, winner_id = COALESCE(?, winner_id), ${timeCol} = datetime('now') WHERE id = ?`)
			.run(status, winnerId, id);
	}

	delete(id: number): void {
		this.db.prepare('DELETE FROM mysteries WHERE id = ?').run(id);
	}

	addHint(mysteryId: number, text: string, cardId: number | null): number {
		const pos = (
			this.db.prepare('SELECT COALESCE(MAX(position),0) + 1 AS p FROM hints WHERE mystery_id = ?').get(mysteryId) as { p: number }
		).p;
		return this.lastId(
			this.db.prepare('INSERT INTO hints (mystery_id, position, text, card_id) VALUES (?, ?, ?, ?)').run(mysteryId, pos, text, cardId)
		);
	}

	deleteHint(mysteryId: number, hintId: number): void {
		this.db.prepare('DELETE FROM hints WHERE id = ? AND mystery_id = ?').run(hintId, mysteryId);
	}

	/** Geeft een hint vrij; een gekoppelde kaart wordt tegelijk voor iedereen uitgesloten. */
	releaseHint(mysteryId: number, hintId: number, cardId: number | null): void {
		this.database.transaction(() => {
			this.db
				.prepare(`UPDATE hints SET released_at = datetime('now') WHERE id = ? AND mystery_id = ? AND released_at IS NULL`)
				.run(hintId, mysteryId);
			if (cardId)
				this.db
					.prepare(`UPDATE mystery_cards SET eliminated_at = datetime('now') WHERE id = ? AND mystery_id = ? AND eliminated_at IS NULL`)
					.run(cardId, mysteryId);
		});
	}

	addGuess(mysteryId: number, userId: number, a: Accusation, text: string, correct: boolean): void {
		this.db
			.prepare(
				'INSERT INTO guesses (mystery_id, user_id, text, correct, person_id, object_id, location_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
			)
			.run(mysteryId, userId, text, correct ? 1 : 0, a.personId, a.objectId, a.locationId);
	}
}
