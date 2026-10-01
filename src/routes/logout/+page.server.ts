import { redirect } from '@sveltejs/kit';
import { AppContainer } from '$lib/server/container';
import { AuthService } from '$lib/server/services/AuthService';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => redirect(303, '/');

export const actions: Actions = {
	default: ({ cookies }) => {
		AppContainer.get().auth.logout(cookies.get(AuthService.COOKIE));
		cookies.delete(AuthService.COOKIE, { path: '/' });
		redirect(303, '/login');
	}
};
