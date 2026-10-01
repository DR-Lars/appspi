import bcrypt from 'bcryptjs';

/** Kleine abstractie zodat het hash-algoritme later vervangbaar is. */
export class PasswordHasher {
	constructor(private readonly rounds = 11) {}

	hash(plain: string): Promise<string> {
		return bcrypt.hash(plain, this.rounds);
	}

	verify(plain: string, hash: string): Promise<boolean> {
		return bcrypt.compare(plain, hash);
	}
}
