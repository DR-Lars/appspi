import { DomainError } from './DomainError';

/**
 * Value object voor geldbedragen. Intern altijd in eurocent (integer)
 * zodat er geen afrondingsfouten ontstaan.
 */
export class Money {
	private constructor(public readonly cents: number) {
		if (!Number.isInteger(cents)) throw new DomainError('Ongeldig bedrag.');
	}

	static zero(): Money {
		return new Money(0);
	}

	static fromCents(cents: number): Money {
		return new Money(Math.round(cents));
	}

	/** Parseert invoer zoals "12,50", "12.50", "€ 1.250,00". */
	static parse(input: string): Money {
		let s = String(input ?? '').replace(/[€\s]/g, '');
		if (!s) throw new DomainError('Vul een bedrag in.');
		// "1.250,50" → "1250.50" ; "12,5" → "12.5"
		if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
		if (!/^-?\d+(\.\d{1,2})?$/.test(s)) throw new DomainError('Ongeldig bedrag. Gebruik bv. 25,50');
		return new Money(Math.round(parseFloat(s) * 100));
	}

	add(other: Money): Money {
		return new Money(this.cents + other.cents);
	}

	subtract(other: Money): Money {
		return new Money(this.cents - other.cents);
	}

	isPositive(): boolean {
		return this.cents > 0;
	}

	/**
	 * Verdeelt het bedrag eerlijk over n delen. Resterende centen gaan
	 * één voor één naar de eerste delen, zodat de som altijd klopt.
	 */
	splitEvenly(parts: number): Money[] {
		if (parts < 1) throw new DomainError('Kies minstens één deelnemer.');
		const base = Math.floor(this.cents / parts);
		const remainder = this.cents - base * parts;
		return Array.from({ length: parts }, (_, i) => new Money(base + (i < remainder ? 1 : 0)));
	}

	/** Percentage van een doelbedrag (0–100, afgekapt). */
	percentageOf(target: Money): number {
		if (target.cents <= 0) return 0;
		return Math.min(100, Math.max(0, (this.cents / target.cents) * 100));
	}

	format(): string {
		return Money.formatCents(this.cents);
	}

	static formatCents(cents: number): string {
		return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
	}
}
