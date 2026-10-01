/** Beperkt het aantal mislukte loginpogingen per sleutel (bv. IP + gebruikersnaam). */
export class LoginThrottle {
	private readonly attempts = new Map<string, { count: number; firstAt: number }>();

	constructor(
		private readonly maxAttempts = 8,
		private readonly windowMs = 15 * 60 * 1000
	) {}

	isBlocked(key: string): boolean {
		const entry = this.attempts.get(key);
		if (!entry) return false;
		if (Date.now() - entry.firstAt > this.windowMs) {
			this.attempts.delete(key);
			return false;
		}
		return entry.count >= this.maxAttempts;
	}

	registerFailure(key: string): void {
		const entry = this.attempts.get(key);
		if (!entry || Date.now() - entry.firstAt > this.windowMs) this.attempts.set(key, { count: 1, firstAt: Date.now() });
		else entry.count++;
	}

	reset(key: string): void {
		this.attempts.delete(key);
	}
}
