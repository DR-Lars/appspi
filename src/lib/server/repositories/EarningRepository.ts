import { BaseRepository } from './BaseRepository';
import { Earning, type Participation } from '../domain/Earning';
import { Money } from '../domain/Money';

interface EarningRow {
	id: number;
	title: string;
	amount_cents: number;
	date: string;
	created_by_name: string | null;
}

export class EarningRepository extends BaseRepository {
	private participantsFor(earningId: number): Participation[] {
		const rows = this.db
			.prepare(
				`SELECT p.user_id, u.display_name, p.share_cents
				 FROM earning_participants p JOIN users u ON u.id = p.user_id
				 WHERE p.earning_id = ? ORDER BY u.display_name COLLATE NOCASE`
			)
			.all(earningId) as { user_id: number; display_name: string; share_cents: number }[];
		return rows.map((r) => ({ userId: r.user_id, displayName: r.display_name, share: Money.fromCents(r.share_cents) }));
	}

	private map(row: EarningRow): Earning {
		return new Earning(
			row.id,
			row.title,
			Money.fromCents(row.amount_cents),
			row.date,
			this.participantsFor(row.id),
			row.created_by_name ?? '—'
		);
	}

	findAll(limit = 200): Earning[] {
		const rows = this.db
			.prepare(
				`SELECT e.id, e.title, e.amount_cents, e.date, u.display_name AS created_by_name
				 FROM earnings e LEFT JOIN users u ON u.id = e.created_by
				 ORDER BY e.date DESC, e.id DESC LIMIT ?`
			)
			.all(limit) as EarningRow[];
		return rows.map((r) => this.map(r));
	}

	findByParticipant(userId: number): Earning[] {
		const rows = this.db
			.prepare(
				`SELECT e.id, e.title, e.amount_cents, e.date, u.display_name AS created_by_name
				 FROM earnings e
				 JOIN earning_participants p ON p.earning_id = e.id AND p.user_id = ?
				 LEFT JOIN users u ON u.id = e.created_by
				 ORDER BY e.date DESC, e.id DESC`
			)
			.all(userId) as EarningRow[];
		return rows.map((r) => this.map(r));
	}

	total(): Money {
		const row = this.db.prepare('SELECT COALESCE(SUM(amount_cents),0) AS total FROM earnings').get() as {
			total: number;
		};
		return Money.fromCents(row.total);
	}

	sharesPerUser(): Map<number, { total: Money; count: number }> {
		const rows = this.db
			.prepare('SELECT user_id, SUM(share_cents) AS total, COUNT(*) AS n FROM earning_participants GROUP BY user_id')
			.all() as { user_id: number; total: number; n: number }[];
		return new Map(rows.map((r) => [r.user_id, { total: Money.fromCents(r.total), count: r.n }]));
	}

	create(title: string, amount: Money, date: string, createdBy: number, shares: { userId: number; share: Money }[]): number {
		return this.database.transaction(() => {
			const r = this.db
				.prepare('INSERT INTO earnings (title, amount_cents, date, created_by) VALUES (?, ?, ?, ?)')
				.run(title, amount.cents, date, createdBy);
			const id = this.lastId(r);
			const stmt = this.db.prepare('INSERT INTO earning_participants (earning_id, user_id, share_cents) VALUES (?, ?, ?)');
			for (const s of shares) stmt.run(id, s.userId, s.share.cents);
			return id;
		});
	}

	delete(id: number): void {
		this.db.prepare('DELETE FROM earnings WHERE id = ?').run(id);
	}
}
