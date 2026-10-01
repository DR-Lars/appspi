import { ClueCard, KIND_LABELS, type CardKind } from '../domain/ClueCard';
import { DomainError } from '../domain/DomainError';
import type { User } from '../domain/User';
import type { ClueCardRepository } from '../repositories/ClueCardRepository';

/** Beheer van de catalogus. Wijzigingen gelden enkel voor nieuwe mysteries. */
export class ClueCardService {
	constructor(private readonly repo: ClueCardRepository) {}

	all(): ClueCard[] {
		return this.repo.findAll();
	}

	active(): ClueCard[] {
		return this.repo.findActive();
	}

	add(kind: string, name: string, admin: User): void {
		ClueCardService.assertAdmin(admin);
		if (!ClueCard.isKind(kind)) throw new DomainError('Ongeldig type kaart.');
		const n = name.trim();
		if (n.length < 2 || n.length > 60) throw new DomainError('Naam moet tussen 2 en 60 tekens zijn.');
		if (this.repo.exists(kind, n)) throw new DomainError(`${KIND_LABELS[kind].single} "${n}" bestaat al.`);
		this.repo.create(kind, n);
	}

	toggle(id: number, admin: User): void {
		ClueCardService.assertAdmin(admin);
		const card = this.repo.findById(id);
		if (!card) throw new DomainError('Kaart niet gevonden.');
		this.repo.setActive(id, !card.active);
	}

	delete(id: number, admin: User): void {
		ClueCardService.assertAdmin(admin);
		this.repo.delete(id);
	}

	private static assertAdmin(user: User): void {
		if (!user.isAdmin) throw new DomainError('Enkel admins kunnen kaarten beheren.');
	}
}
