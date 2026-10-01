import { fail, error, type RequestEvent } from '@sveltejs/kit';
import { DomainError } from './domain/DomainError';
import type { User } from './domain/User';

/** Helpers voor route-handlers: rechten controleren en domeinfouten omzetten naar formulierfouten. */
export class Http {
	static requireUser(event: Pick<RequestEvent, 'locals'>): User {
		const user = event.locals.user;
		if (!user) error(401, 'Niet aangemeld.');
		return user;
	}

	static requireAdmin(event: Pick<RequestEvent, 'locals'>): User {
		const user = Http.requireUser(event);
		if (!user.isAdmin) error(403, 'Enkel voor admins.');
		return user;
	}

	/** Voert een actie uit; DomainErrors worden een nette `fail(400)` met boodschap. */
	static async action<T extends Record<string, unknown> | void>(
		fn: () => T | Promise<T>,
		successMessage?: string
	) {
		try {
			const result = await fn();
			return { success: true as const, message: successMessage ?? 'Opgeslagen.', ...(result ?? {}) };
		} catch (e) {
			if (e instanceof DomainError) return fail(400, { success: false as const, message: e.message });
			throw e;
		}
	}

	static str(form: FormData, key: string): string {
		const v = form.get(key);
		return typeof v === 'string' ? v : '';
	}

	static int(form: FormData, key: string): number {
		const n = Number(Http.str(form, key));
		if (!Number.isInteger(n)) throw new DomainError('Ongeldige invoer.');
		return n;
	}

	static ints(form: FormData, key: string): number[] {
		return form
			.getAll(key)
			.map((v) => Number(v))
			.filter((n) => Number.isInteger(n) && n > 0);
	}
}
