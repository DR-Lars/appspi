import { AppContainer } from '$lib/server/container';
import { DomainError } from '$lib/server/domain/DomainError';
import { Http } from '$lib/server/http';
import { AuthService } from '$lib/server/services/AuthService';
import type { Actions } from './$types';

export const actions: Actions = {
	wachtwoord: async (event) => {
		const user = Http.requireUser(event);
		const form = await event.request.formData();
		return Http.action(async () => {
			const next = Http.str(form, 'nieuw');
			if (next !== Http.str(form, 'bevestig')) throw new DomainError('De nieuwe wachtwoorden komen niet overeen.');
			await AppContainer.get().auth.changePassword(
				user,
				Http.str(form, 'huidig'),
				next,
				event.cookies.get(AuthService.COOKIE)
			);
		}, 'Je wachtwoord is gewijzigd.');
	}
};
