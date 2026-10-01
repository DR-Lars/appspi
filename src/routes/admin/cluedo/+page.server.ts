import { redirect } from '@sveltejs/kit';
import { AppContainer } from '$lib/server/container';
import { Http } from '$lib/server/http';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const app = AppContainer.get();
	const active = app.clueCards.active();
	return {
		mysteries: app.mysteries.all().map((m) => ({
			...m.toJSON(),
			guessCount: m.guesses.length,
			releasedCount: m.releasedHints.length
		})),
		deck: {
			members: app.users.all().length,
			persoon: active.filter((c) => c.kind === 'persoon').length,
			voorwerp: active.filter((c) => c.kind === 'voorwerp').length,
			locatie: active.filter((c) => c.kind === 'locatie').length
		}
	};
};

export const actions: Actions = {
	aanmaken: async (event) => {
		const admin = Http.requireAdmin(event);
		const form = await event.request.formData();
		let id = 0;
		const result = await Http.action(() => {
			id = AppContainer.get().mysteries.create(
				{ title: Http.str(form, 'titel'), story: Http.str(form, 'verhaal'), maxGuesses: Http.str(form, 'gokken') },
				admin
			);
		});
		if (id) redirect(303, `/admin/cluedo/${id}`);
		return result;
	}
};
