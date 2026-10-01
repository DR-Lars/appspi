import { BaseRepository } from './BaseRepository';

export class SessionRepository extends BaseRepository {
	create(id: string, userId: number, expiresAt: number): void {
		this.db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(id, userId, expiresAt);
	}

	find(id: string): { userId: number; expiresAt: number } | null {
		const row = this.db.prepare('SELECT user_id, expires_at FROM sessions WHERE id = ?').get(id) as
			| { user_id: number; expires_at: number }
			| undefined;
		return row ? { userId: row.user_id, expiresAt: row.expires_at } : null;
	}

	extend(id: string, expiresAt: number): void {
		this.db.prepare('UPDATE sessions SET expires_at = ? WHERE id = ?').run(expiresAt, id);
	}

	delete(id: string): void {
		this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
	}

	deleteForUser(userId: number, exceptId?: string): void {
		this.db.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').run(userId, exceptId ?? '');
	}

	deleteExpired(now: number): void {
		this.db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
	}
}
