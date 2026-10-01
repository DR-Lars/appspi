import type BetterSqlite3 from 'better-sqlite3';
import type { Database } from '../db/Database';

/** Abstracte basis voor alle repositories: gedeelde toegang tot de database. */
export abstract class BaseRepository {
	protected readonly db: BetterSqlite3.Database;

	constructor(protected readonly database: Database) {
		this.db = database.connection;
	}

	protected lastId(result: BetterSqlite3.RunResult): number {
		return Number(result.lastInsertRowid);
	}
}
