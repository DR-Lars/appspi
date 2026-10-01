import { AppContainer } from '$lib/server/container';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const { budget } = AppContainer.get();
	return {
		group: budget.groupProgress().toJSON(),
		standings: budget.standings().map((s) => ({
			id: s.user.id,
			name: s.user.displayName,
			isAdmin: s.user.isAdmin,
			personal: s.personal.toJSON(),
			activities: s.activities
		}))
	};
};
