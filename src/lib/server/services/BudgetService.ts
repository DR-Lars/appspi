import { DomainError } from '../domain/DomainError';
import { Money } from '../domain/Money';
import { Progress } from '../domain/Progress';
import type { User } from '../domain/User';
import type { EarningRepository } from '../repositories/EarningRepository';
import type { UserRepository } from '../repositories/UserRepository';
import type { SettingsService } from './SettingsService';

export interface MemberStanding {
	user: User;
	/** Eigen aandeel in alle opbrengsten t.o.v. het persoonlijk doel. */
	personal: Progress;
	activities: number;
}

export class BudgetService {
	constructor(
		private readonly users: UserRepository,
		private readonly earnings: EarningRepository,
		private readonly settings: SettingsService
	) {}

	// ---------- Voortgang ----------

	/** Persoonlijk budget = som van de aandelen van dit lid in alle opbrengsten. */
	personalProgress(userId: number): Progress {
		return new Progress(this.groupContributionOf(userId), this.settings.get().personalTarget);
	}

	groupProgress(): Progress {
		return new Progress(this.earnings.total(), this.settings.get().groupTarget);
	}

	groupContributionOf(userId: number): Money {
		return this.earnings.sharesPerUser().get(userId)?.total ?? Money.zero();
	}

	standings(): MemberStanding[] {
		const target = this.settings.get().personalTarget;
		const shares = this.earnings.sharesPerUser();
		return this.users
			.findAll()
			.map((user) => ({
				user,
				personal: new Progress(shares.get(user.id)?.total ?? Money.zero(), target),
				activities: shares.get(user.id)?.count ?? 0
			}))
			.sort((a, b) => b.personal.current.cents - a.personal.current.cents);
	}

	// ---------- Opbrengsten ----------
	// Al het geld wordt verdiend met activiteiten. Het totaal gaat naar de groepspot;
	// het aandeel van elke deelnemer telt voor diens persoonlijk budget.

	/**
	 * Berekent de automatische verdeling zonder iets op te slaan.
	 * Resterende centen gaan naar wie tot nu toe het minst verdiend heeft
	 * (bij gelijkstand: laagste id), zodat niemand structureel voordeel heeft.
	 */
	previewSplit(amount: Money, participantIds: number[]): { userId: number; share: Money }[] {
		const totals = this.earnings.sharesPerUser();
		const earned = (id: number) => totals.get(id)?.total.cents ?? 0;
		const ids = [...new Set(participantIds)].sort((a, b) => earned(a) - earned(b) || a - b);
		const parts = amount.splitEvenly(ids.length);
		return ids.map((userId, i) => ({ userId, share: parts[i]! }));
	}

	recordEarning(input: { title: string; amount: string; date: string; participantIds: number[] }, admin: User): number {
		BudgetService.assertAdmin(admin);
		const title = input.title.trim();
		if (!title) throw new DomainError('Geef de opbrengst een omschrijving.');
		const amount = Money.parse(input.amount);
		if (!amount.isPositive()) throw new DomainError('Het bedrag moet groter dan 0 zijn.');
		const date = BudgetService.validDate(input.date);
		for (const id of input.participantIds)
			if (!this.users.findById(id)) throw new DomainError('Onbekende deelnemer geselecteerd.');
		const shares = this.previewSplit(amount, input.participantIds);
		return this.earnings.create(title, amount, date, admin.id, shares);
	}

	deleteEarning(id: number, admin: User): void {
		BudgetService.assertAdmin(admin);
		this.earnings.delete(id);
	}

	allEarnings() {
		return this.earnings.findAll();
	}

	earningsOf(userId: number) {
		return this.earnings.findByParticipant(userId);
	}

	// ---------- Helpers ----------

	private static assertAdmin(user: User): void {
		if (!user.isAdmin) throw new DomainError('Enkel admins kunnen dit doen.');
	}

	private static validDate(date: string): string {
		if (!date) return new Date().toISOString().slice(0, 10);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) throw new DomainError('Ongeldige datum.');
		return date;
	}
}
