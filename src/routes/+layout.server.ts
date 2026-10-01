import { AppContainer } from '$lib/server/container';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	const app = AppContainer.get();
	return {
		user: locals.user?.toJSON() ?? null,
		settings: app.settings.toJSON(),
		clueActive: locals.user ? app.mysteries.active() !== null : false
	};
};
