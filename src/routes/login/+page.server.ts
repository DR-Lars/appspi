import { fail, redirect } from '@sveltejs/kit';
import { AppContainer } from '$lib/server/container';
import { DomainError } from '$lib/server/domain/DomainError';
import { AuthService } from '$lib/server/services/AuthService';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/');
};

const safeRedirect = (target: string | null) =>
	target && target.startsWith('/') && !target.startsWith('//') ? target : '/';

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		const form = await request.formData();
		const username = String(form.get('username') ?? '');
		const password = String(form.get('password') ?? '');
		try {
			const { token, expires } = await AppContainer.get().auth.login(username, password, getClientAddress());
			cookies.set(AuthService.COOKIE, token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: url.protocol === 'https:',
				expires
			});
		} catch (e) {
			if (e instanceof DomainError) return fail(400, { username, message: e.message });
			throw e;
		}
		redirect(303, safeRedirect(url.searchParams.get('terug')));
	}
};
