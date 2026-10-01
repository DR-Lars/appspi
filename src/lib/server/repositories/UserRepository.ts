import { BaseRepository } from './BaseRepository';
import { User, type Role, type UserRow } from '../domain/User';

export class UserRepository extends BaseRepository {
	findById(id: number): User | null {
		const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
		return row ? User.fromRow(row) : null;
	}

	/** Geeft ook de hash terug; enkel voor de AuthService. */
	findCredentials(username: string): { user: User; hash: string } | null {
		const row = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
		return row ? { user: User.fromRow(row), hash: row.password_hash } : null;
	}

	findHash(id: number): string | null {
		const row = this.db.prepare('SELECT password_hash FROM users WHERE id = ?').get(id) as
			| { password_hash: string }
			| undefined;
		return row?.password_hash ?? null;
	}

	findAll(): User[] {
		const rows = this.db
			.prepare('SELECT * FROM users ORDER BY role, display_name COLLATE NOCASE')
			.all() as UserRow[];
		return rows.map(User.fromRow);
	}

	findMembers(): User[] {
		return this.findAll();
	}

	existsByUsername(username: string): boolean {
		return !!this.db.prepare('SELECT 1 FROM users WHERE username = ?').get(username);
	}

	countByRole(role: Role): number {
		return (this.db.prepare('SELECT COUNT(*) AS n FROM users WHERE role = ?').get(role) as { n: number }).n;
	}

	create(username: string, displayName: string, hash: string, role: Role): number {
		const r = this.db
			.prepare('INSERT INTO users (username, display_name, password_hash, role) VALUES (?, ?, ?, ?)')
			.run(username, displayName, hash, role);
		return this.lastId(r);
	}

	updateDisplayName(id: number, displayName: string): void {
		this.db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName, id);
	}

	updatePassword(id: number, hash: string): void {
		this.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);
	}

	delete(id: number): void {
		this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
	}
}
