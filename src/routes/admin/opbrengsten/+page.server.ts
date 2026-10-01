import { AppContainer } from '$lib/server/container';
import { Http } from '$lib/server/http';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const { budget, users } = AppContainer.get();
	return {
		members: budget.standings().map((s) => ({ ...s.user.toJSON(), earnedCents: s.personal.current.cents })).sort((a, b) => a.displayName.localeCompare(b.displayName, 'nl')),
		earnings: budget.allEarnings().map((e) => e.toJSON())
	};
};

export const actions: Actions = {
	toevoegen: async (event) => {
		const admin = Http.requireAdmin(event);
		const form = await event.request.formData();
		return Http.action(() => {
			AppContainer.get().budget.recordEarning(
				{
					title: Http.str(form, 'titel'),
					amount: Http.str(form, 'bedrag'),
					date: Http.str(form, 'datum'),
					participantIds: Http.ints(form, 'deelnemers')
				},
				admin
			);
		}, 'Opbrengst toegevoegd en verdeeld.');
	},
	verwijderen: async (event) => {
		const admin = Http.requireAdmin(event);
		const form = await event.request.formData();
		return Http.action(() => AppContainer.get().budget.deleteEarning(Http.int(form, 'id'), admin), 'Opbrengst verwijderd.');
	}
};
