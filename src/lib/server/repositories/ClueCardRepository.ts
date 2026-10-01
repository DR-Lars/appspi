import { BaseRepository } from './BaseRepository';
import { ClueCard, type CardKind } from '../domain/ClueCard';

interface CardRow {
	id: number;
	kind: CardKind;
	name: string;
	active: number;
}

/** De vaste catalogus van personen, voorwerpen en locaties. */
export class ClueCardRepository extends BaseRepository {
	private static map(r: CardRow): ClueCard {
		return new ClueCard(r.id, r.kind, r.name, r.active === 1);
	}

	findAll(): ClueCard[] {
		const rows = this.db
			.prepare("SELECT * FROM clue_cards ORDER BY CASE kind WHEN 'persoon' THEN 1 WHEN 'voorwerp' THEN 2 ELSE 3 END, name COLLATE NOCASE")
			.all() as CardRow[];
		return rows.map(ClueCardRepository.map);
	}

	findActive(): ClueCard[] {
		return this.findAll().filter((c) => c.active);
	}

	findById(id: number): ClueCard | null {
		const r = this.db.prepare('SELECT * FROM clue_cards WHERE id = ?').get(id) as CardRow | undefined;
		return r ? ClueCardRepository.map(r) : null;
	}

	exists(kind: CardKind, name: string): boolean {
		return !!this.db.prepare('SELECT 1 FROM clue_cards WHERE kind = ? AND name = ? COLLATE NOCASE').get(kind, name);
	}

	create(kind: CardKind, name: string): number {
		return this.lastId(this.db.prepare('INSERT INTO clue_cards (kind, name) VALUES (?, ?)').run(kind, name));
	}

	setActive(id: number, active: boolean): void {
		this.db.prepare('UPDATE clue_cards SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
	}

	delete(id: number): void {
		this.db.prepare('DELETE FROM clue_cards WHERE id = ?').run(id);
	}
}
