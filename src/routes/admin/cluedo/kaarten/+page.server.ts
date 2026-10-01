import { AppContainer } from '$lib/server/container';
import { Http } from '$lib/server/http';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const app = AppContainer.get();
	return {
		cards: app.clueCards.all().map((c) => c.toJSON()),
		members: app.users.all().map((u) => u.displayName)
	};
};

export const actions: Actions = {
	toevoegen: async (event) => {
		const admin = Http.requireAdmin(event);
		const form = await event.request.formData();
		return Http.action(() => AppContainer.get().clueCards.add(Http.str(form, 'type'), Http.str(form, 'naam'), admin), 'Kaart toegevoegd.');
	},
	wissel: async (event) => {
		const admin = Http.requireAdmin(event);
		const form = await event.request.formData();
		return Http.action(() => AppContainer.get().clueCards.toggle(Http.int(form, 'id'), admin), 'Kaart bijgewerkt.');
	},
	verwijderen: async (event) => {
		const admin = Http.requireAdmin(event);
		const form = await event.request.formData();
		return Http.action(() => AppContainer.get().clueCards.delete(Http.int(form, 'id'), admin), 'Kaart verwijderd.');
	}
};
