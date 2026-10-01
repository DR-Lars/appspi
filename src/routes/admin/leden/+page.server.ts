import { AppContainer } from '$lib/server/container';
import { Http } from '$lib/server/http';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	members: AppContainer.get().users.all().map((u) => ({ ...u.toJSON(), createdAt: u.createdAt }))
});

export const actions: Actions = {
	toevoegen: async (event) => {
		Http.requireAdmin(event);
		const form = await event.request.formData();
		return Http.action(async () => {
			await AppContainer.get().users.create(Http.str(form, 'gebruikersnaam'), Http.str(form, 'naam'), Http.str(form, 'wachtwoord'));
		}, 'Lid aangemaakt.');
	},
	hernoemen: async (event) => {
		Http.requireAdmin(event);
		const form = await event.request.formData();
		return Http.action(() => AppContainer.get().users.rename(Http.int(form, 'id'), Http.str(form, 'naam')), 'Naam aangepast.');
	},
	wachtwoord: async (event) => {
		Http.requireAdmin(event);
		const form = await event.request.formData();
		return Http.action(
			() => AppContainer.get().users.resetPassword(Http.int(form, 'id'), Http.str(form, 'wachtwoord')),
			'Wachtwoord opnieuw ingesteld.'
		);
	},
	verwijderen: async (event) => {
		const admin = Http.requireAdmin(event);
		const form = await event.request.formData();
		return Http.action(() => AppContainer.get().users.delete(Http.int(form, 'id'), admin), 'Lid verwijderd.');
	}
};
