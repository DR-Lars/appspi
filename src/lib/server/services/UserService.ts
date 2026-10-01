import { DomainError } from '../domain/DomainError';
import type { Role, User } from '../domain/User';
import type { SessionRepository } from '../repositories/SessionRepository';
import type { UserRepository } from '../repositories/UserRepository';
import { AuthService } from './AuthService';
import type { PasswordHasher } from './PasswordHasher';

export interface AdminSeed {
	username: string;
	name: string;
	password: string;
}

export class UserService {
	static readonly MAX_ADMINS = 2;

	constructor(
		private readonly users: UserRepository,
		private readonly sessions: SessionRepository,
		private readonly hasher: PasswordHasher
	) {}

	all(): User[] {
		return this.users.findAll();
	}

	get(id: number): User {
		const u = this.users.findById(id);
		if (!u) throw new DomainError('Lid niet gevonden.');
		return u;
	}

	private static validateUsername(username: string): string {
		const u = username.trim().toLowerCase();
		if (!/^[a-z0-9._-]{3,32}$/.test(u))
			throw new DomainError('Gebruikersnaam: 3–32 tekens, enkel letters, cijfers, punt, - of _.');
		return u;
	}

	private static validateName(name: string): string {
		const n = name.trim();
		if (n.length < 2 || n.length > 60) throw new DomainError('Naam moet tussen 2 en 60 tekens zijn.');
		return n;
	}

	async create(username: string, displayName: string, password: string, role: Role = 'lid'): Promise<number> {
		const u = UserService.validateUsername(username);
		const n = UserService.validateName(displayName);
		AuthService.assertStrong(password);
		if (this.users.existsByUsername(u)) throw new DomainError('Deze gebruikersnaam bestaat al.');
		if (role === 'admin' && this.users.countByRole('admin') >= UserService.MAX_ADMINS)
			throw new DomainError(`Er zijn maximaal ${UserService.MAX_ADMINS} admins.`);
		return this.users.create(u, n, await this.hasher.hash(password), role);
	}

	rename(id: number, displayName: string): void {
		this.get(id);
		this.users.updateDisplayName(id, UserService.validateName(displayName));
	}

	async resetPassword(id: number, password: string): Promise<void> {
		this.get(id);
		AuthService.assertStrong(password);
		this.users.updatePassword(id, await this.hasher.hash(password));
		this.sessions.deleteForUser(id);
	}

	delete(id: number, actor: User): void {
		const target = this.get(id);
		if (target.isAdmin) throw new DomainError('Admin-accounts kunnen niet verwijderd worden.');
		if (target.id === actor.id) throw new DomainError('Je kan jezelf niet verwijderen.');
		this.users.delete(id);
	}

	/** Maakt de twee admin-accounts aan bij de eerste start (idempotent). */
	async seedAdmins(seeds: AdminSeed[]): Promise<void> {
		for (const seed of seeds) {
			if (!seed.username || !seed.password) continue;
			if (this.users.existsByUsername(seed.username.toLowerCase())) continue;
			if (this.users.countByRole('admin') >= UserService.MAX_ADMINS) break;
			await this.create(seed.username, seed.name || seed.username, seed.password, 'admin');
			console.log(`[appspi] Admin-account '${seed.username}' aangemaakt.`);
		}
	}
}
