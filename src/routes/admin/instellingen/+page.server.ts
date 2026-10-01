import { AppContainer } from '$lib/server/container';
import { Http } from '$lib/server/http';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		Http.requireAdmin(event);
		const form = await event.request.formData();
		return Http.action(() =>
			AppContainer.get().settings.update({
				personalTarget: Http.str(form, 'persoonlijk'),
				groupTarget: Http.str(form, 'groep'),
				tripName: Http.str(form, 'bestemming'),
				tripDate: Http.str(form, 'vertrek')
			})
		, 'Instellingen opgeslagen.');
	}
};
