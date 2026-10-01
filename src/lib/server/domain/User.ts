export type Role = 'admin' | 'lid';

export interface UserRow {
	id: number;
	username: string;
	display_name: string;
	password_hash: string;
	role: Role;
	created_at: string;
}

/** Entiteit: een lid of admin van de groep. */
export class User {
	constructor(
		public readonly id: number,
		public readonly username: string,
		public readonly displayName: string,
		public readonly role: Role,
		public readonly createdAt: string
	) {}

	static fromRow(row: UserRow): User {
		return new User(row.id, row.username, row.display_name, row.role, row.created_at);
	}

	get isAdmin(): boolean {
		return this.role === 'admin';
	}

	get initials(): string {
		return this.displayName
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((p) => p[0]!.toUpperCase())
			.join('');
	}

	/** Serialiseerbare vorm voor de client (zonder wachtwoord-hash). */
	toJSON() {
		return {
			id: this.id,
			username: this.username,
			displayName: this.displayName,
			role: this.role,
			isAdmin: this.isAdmin,
			initials: this.initials
		};
	}
}

export type PublicUser = ReturnType<User['toJSON']>;
