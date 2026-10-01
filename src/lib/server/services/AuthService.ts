import { createHash, randomBytes } from 'node:crypto';
import { DomainError } from '../domain/DomainError';
import type { User } from '../domain/User';
import type { SessionRepository } from '../repositories/SessionRepository';
import type { UserRepository } from '../repositories/UserRepository';
import type { LoginThrottle } from './LoginThrottle';
import type { PasswordHasher } from './PasswordHasher';

const DAY = 24 * 60 * 60 * 1000;

export class AuthService {
	static readonly COOKIE = 'appspi_sessie';
	static readonly SESSION_DAYS = 30;
	static readonly MIN_PASSWORD = 8;

	constructor(
		private readonly users: UserRepository,
		private readonly sessions: SessionRepository,
		private readonly hasher: PasswordHasher,
		private readonly throttle: LoginThrottle
	) {}

	/** Alleen de SHA-256 van het token wordt bewaard; een gelekte DB bevat geen bruikbare sessies. */
	private static hashToken(token: string): string {
		return createHash('sha256').update(token).digest('hex');
	}

	async login(username: string, password: string, clientKey: string): Promise<{ token: string; user: User; expires: Date }> {
		const key = `${clientKey}:${username.toLowerCase()}`;
		if (this.throttle.isBlocked(key)) throw new DomainError('Te veel mislukte pogingen. Probeer het later opnieuw.');

		const found = this.users.findCredentials(username.trim());
		const ok = found ? await this.hasher.verify(password, found.hash) : false;
		if (!found || !ok) {
			this.throttle.registerFailure(key);
			throw new DomainError('Gebruikersnaam of wachtwoord is onjuist.');
		}
		this.throttle.reset(key);
		const { token, expires } = this.createSession(found.user.id);
		return { token, user: found.user, expires };
	}

	createSession(userId: number): { token: string; expires: Date } {
		const token = randomBytes(32).toString('base64url');
		const expires = new Date(Date.now() + AuthService.SESSION_DAYS * DAY);
		this.sessions.create(AuthService.hashToken(token), userId, expires.getTime());
		return { token, expires };
	}

	/** Valideert een sessietoken en verlengt het automatisch als het over de helft is. */
	validate(token: string | undefined): { user: User; expires: Date } | null {
		if (!token) return null;
		const id = AuthService.hashToken(token);
		const session = this.sessions.find(id);
		if (!session) return null;
		const now = Date.now();
		if (session.expiresAt < now) {
			this.sessions.delete(id);
			return null;
		}
		const user = this.users.findById(session.userId);
		if (!user) return null;
		let expiresAt = session.expiresAt;
		if (expiresAt - now < (AuthService.SESSION_DAYS / 2) * DAY) {
			expiresAt = now + AuthService.SESSION_DAYS * DAY;
			this.sessions.extend(id, expiresAt);
		}
		return { user, expires: new Date(expiresAt) };
	}

	logout(token: string | undefined): void {
		if (token) this.sessions.delete(AuthService.hashToken(token));
	}

	async changePassword(user: User, current: string, next: string, currentToken: string | undefined): Promise<void> {
		const hash = this.users.findHash(user.id);
		if (!hash || !(await this.hasher.verify(current, hash))) throw new DomainError('Je huidige wachtwoord klopt niet.');
		AuthService.assertStrong(next);
		this.users.updatePassword(user.id, await this.hasher.hash(next));
		// Andere sessies uitloggen
		this.sessions.deleteForUser(user.id, currentToken ? AuthService.hashToken(currentToken) : undefined);
	}

	static assertStrong(password: string): void {
		if (password.length < AuthService.MIN_PASSWORD)
			throw new DomainError(`Wachtwoord moet minstens ${AuthService.MIN_PASSWORD} tekens lang zijn.`);
	}

	cleanup(): void {
		this.sessions.deleteExpired(Date.now());
	}
}
