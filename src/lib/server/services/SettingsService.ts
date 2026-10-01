import { DomainError } from '../domain/DomainError';
import { Money } from '../domain/Money';
import type { SettingsRepository } from '../repositories/SettingsRepository';

export interface TripSettings {
	personalTarget: Money;
	groupTarget: Money;
	tripName: string;
	tripDate: string | null;
}

export class SettingsService {
	static readonly DEFAULTS = {
		personal_target_cents: '60000',
		group_target_cents: '600000',
		trip_name: 'Albufeira',
		trip_date: ''
	};

	constructor(private readonly repo: SettingsRepository) {}

	private read(key: keyof typeof SettingsService.DEFAULTS): string {
		return this.repo.get(key) ?? SettingsService.DEFAULTS[key];
	}

	get(): TripSettings {
		return {
			personalTarget: Money.fromCents(Number(this.read('personal_target_cents'))),
			groupTarget: Money.fromCents(Number(this.read('group_target_cents'))),
			tripName: this.read('trip_name'),
			tripDate: this.read('trip_date') || null
		};
	}

	update(input: { personalTarget: string; groupTarget: string; tripName: string; tripDate: string }): void {
		const personal = Money.parse(input.personalTarget);
		const group = Money.parse(input.groupTarget);
		if (!personal.isPositive() || !group.isPositive()) throw new DomainError('Doelbedragen moeten groter dan 0 zijn.');
		const name = input.tripName.trim();
		if (!name) throw new DomainError('Geef de bestemming een naam.');
		if (input.tripDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.tripDate)) throw new DomainError('Ongeldige datum.');
		this.repo.set('personal_target_cents', String(personal.cents));
		this.repo.set('group_target_cents', String(group.cents));
		this.repo.set('trip_name', name);
		this.repo.set('trip_date', input.tripDate || '');
	}

	toJSON() {
		const s = this.get();
		return {
			personalTargetCents: s.personalTarget.cents,
			groupTargetCents: s.groupTarget.cents,
			tripName: s.tripName,
			tripDate: s.tripDate
		};
	}
}
