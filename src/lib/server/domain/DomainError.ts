/** Fout die veilig aan de gebruiker getoond mag worden (Nederlandstalige boodschap). */
export class DomainError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'DomainError';
	}
}
