import { redirect, type Handle } from '@sveltejs/kit';
import { AppContainer } from '$lib/server/container';
import { AuthService } from '$lib/server/services/AuthService';

const PUBLIC_PATHS = ['/login'];

export const handle: Handle = async ({ event, resolve }) => {
	await AppContainer.init();
	const app = AppContainer.get();

	const token = event.cookies.get(AuthService.COOKIE);
	const session = app.auth.validate(token);
	event.locals.user = session?.user ?? null;

	if (session && token) {
		event.cookies.set(AuthService.COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: event.url.protocol === 'https:',
			expires: session.expires
		});
	} else if (token) {
		event.cookies.delete(AuthService.COOKIE, { path: '/' });
	}

	const path = event.url.pathname;
	const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));

	if (!event.locals.user && !isPublic) redirect(303, `/login?terug=${encodeURIComponent(path)}`);
	if (path.startsWith('/admin') && !event.locals.user?.isAdmin) redirect(303, '/');

	return resolve(event);
};
