import { AppContainer } from '$lib/server/container';
import { Http } from '$lib/server/http';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	const user = Http.requireUser(event);
	const { mysteries } = AppContainer.get();
	const active = mysteries.active();

	return {
		active: active
			? {
					...active.toJSON(),
					myGuesses: active.guessesBy(user.id).map((g) => ({ id: g.id, text: g.text, createdAt: g.createdAt })),
					remaining: active.remainingGuessesFor(user.id),
					// Van anderen tonen we enkel wie beschuldigde, niet wat.
					feed: active.guesses.slice(0, 15).map((g) => ({ id: g.id, name: g.displayName, createdAt: g.createdAt }))
				}
			: null,
		history: mysteries.finished().map((m) => m.toJSON())
	};
};

export const actions: Actions = {
	beschuldig: async (event) => {
		const user = Http.requireUser(event);
		const form = await event.request.formData();
		let correct = false;
		const result = await Http.action(() => {
			correct = AppContainer.get().mysteries.accuse(
				Http.int(form, 'id'),
				{ personId: Http.int(form, 'persoon'), objectId: Http.int(form, 'voorwerp'), locationId: Http.int(form, 'locatie') },
				user
			).correct;
		});
		if ('success' in result && result.success)
			return {
				success: true,
				correct,
				message: correct ? 'Juist! Jij hebt het mysterie opgelost! 🎉' : 'Helaas, dat is niet de juiste combinatie.'
			};
		return result;
	}
};
