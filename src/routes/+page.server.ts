import { AppContainer } from '$lib/server/container';
import { Http } from '$lib/server/http';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	const user = Http.requireUser(event);
	const { budget, mysteries } = AppContainer.get();

	const standings = budget.standings();
	return {
		personal: budget.personalProgress(user.id).toJSON(),
		group: budget.groupProgress().toJSON(),
		myEarnings: budget.earningsOf(user.id).map((e) => {
			const j = e.toJSON();
			return { ...j, myShareCents: j.participants.find((p) => p.userId === user.id)?.shareCents ?? 0 };
		}),
		recentEarnings: budget.allEarnings().slice(0, 6).map((e) => e.toJSON()),
		leaderboard: standings.map((s) => ({
			id: s.user.id,
			name: s.user.displayName,
			initials: s.user.initials,
			activities: s.activities,
			personal: s.personal.toJSON()
		})),
		activeMystery: mysteries.active()?.toJSON() ?? null
	};
};
