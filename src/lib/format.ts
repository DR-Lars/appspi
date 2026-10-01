/** Gedeelde (client + server) weergavehelpers in het Nederlands. */
export const euro = (cents: number): string =>
	new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);

export const datum = (iso: string | null | undefined): string => {
	if (!iso) return '—';
	const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso.replace(' ', 'T') + 'Z');
	return new Intl.DateTimeFormat('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
};

export const tijdstip = (iso: string | null | undefined): string => {
	if (!iso) return '—';
	const d = new Date(iso.replace(' ', 'T') + 'Z');
	return new Intl.DateTimeFormat('nl-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d);
};

export const vandaag = (): string => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const dagenTot = (iso: string | null): number | null => {
	if (!iso) return null;
	const diff = new Date(iso + 'T00:00:00').getTime() - new Date(vandaag() + 'T00:00:00').getTime();
	return Math.round(diff / 86400000);
};

/** Client-side voorbeeld van de verdeling (zelfde algoritme als Money.splitEvenly). */
export const verdeel = (cents: number, delen: number): number[] => {
	if (delen < 1 || !Number.isFinite(cents) || cents <= 0) return [];
	const basis = Math.floor(cents / delen);
	const rest = cents - basis * delen;
	return Array.from({ length: delen }, (_, i) => basis + (i < rest ? 1 : 0));
};

export const parseEuro = (input: string): number => {
	let s = String(input ?? '').replace(/[€\s]/g, '');
	if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
	const n = parseFloat(s);
	return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

export const statusLabel: Record<string, string> = {
	concept: 'Concept',
	actief: 'Bezig',
	opgelost: 'Opgelost',
	gesloten: 'Gesloten'
};

export const kindLabels = {
	persoon: { single: 'Persoon', plural: 'Personen' },
	voorwerp: { single: 'Voorwerp', plural: 'Voorwerpen' },
	locatie: { single: 'Locatie', plural: 'Locaties' }
} as const;
