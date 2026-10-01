import { error, redirect } from '@sveltejs/kit';
import { AppContainer } from '$lib/server/container';
import { DomainError } from '$lib/server/domain/DomainError';
import { Http } from '$lib/server/http';
import { ClueCard } from '$lib/server/domain/ClueCard';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	try {
		const m = AppContainer.get().mysteries.get(Number(params.id));
		return { mystery: { ...m.toJSON(true), guesses: m.guesses } };
	} catch (e) {
		if (e instanceof DomainError) error(404, e.message);
		throw e;
	}
};

type Handler = (id: number, form: FormData, admin: ReturnType<typeof Http.requireAdmin>) => void;

/** Kleine fabriek: elke actie krijgt het mysterie-id, formulier en de admin. */
const act =
	(handler: Handler, message: string): Actions[string] =>
	async (event) => {
		const admin = Http.requireAdmin(event);
		const form = await event.request.formData();
		return Http.action(() => handler(Number(event.params.id), form, admin), message);
	};

const svc = () => AppContainer.get().mysteries;
const optionalInt = (f: FormData, key: string) => Number(Http.str(f, key)) || null;

export const actions: Actions = {
	bewerken: act(
		(id, f, a) => svc().update(id, { title: Http.str(f, 'titel'), story: Http.str(f, 'verhaal'), maxGuesses: Http.str(f, 'gokken') }, a),
		'Mysterie bijgewerkt.'
	),
	herloten: act((id, _f, a) => svc().reroll(id, a), 'Nieuwe (geheime) oplossing getrokken.'),
	hintToevoegen: act((id, f, a) => svc().addHint(id, Http.str(f, 'hint'), a), 'Hint toegevoegd.'),
	autoHint: async (event) => {
		const admin = Http.requireAdmin(event);
		const form = await event.request.formData();
		const kind = Http.str(form, 'type');
		let name = '';
		const result = await Http.action(() => {
			name = svc().autoHint(Number(event.params.id), ClueCard.isKind(kind) ? kind : null, admin).name;
		});
		return 'success' in result && result.success ? { success: true, message: `Hint vrijgegeven: "${name}" is uitgesloten.` } : result;
	},
	hintVerwijderen: act((id, f, a) => svc().deleteHint(id, Http.int(f, 'hintId'), a), 'Hint verwijderd.'),
	starten: act((id, _f, a) => svc().start(id, a), 'Het spel is gestart! Leden zien nu het mysterie.'),
	hintVrijgeven: act((id, f, a) => svc().releaseHint(id, optionalInt(f, 'hintId'), a), 'Hint vrijgegeven.'),
	afsluiten: act((id, _f, a) => svc().close(id, a), 'Mysterie afgesloten.'),
	verwijderen: async (event) => {
		const admin = Http.requireAdmin(event);
		const result = await Http.action(() => svc().delete(Number(event.params.id), admin));
		if ('success' in result && result.success) redirect(303, '/admin/cluedo');
		return result;
	}
};
