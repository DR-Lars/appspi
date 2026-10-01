import BetterSqlite3 from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { migrations } from './migrations';

/** Wrapper rond de SQLite-verbinding; voert migraties uit bij het openen. */
export class Database {
	readonly connection: BetterSqlite3.Database;

	constructor(path: string) {
		if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
		this.connection = new BetterSqlite3(path);
		this.connection.pragma('journal_mode = WAL');
		this.connection.pragma('foreign_keys = ON');
		this.migrate();
	}

	private migrate(): void {
		const db = this.connection;
		db.exec('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)');
		const row = db.prepare('SELECT version FROM schema_version').get() as { version: number } | undefined;
		let current = row?.version ?? 0;
		if (!row) db.prepare('INSERT INTO schema_version (version) VALUES (0)').run();

		for (const [index, sql] of migrations.entries()) {
			const version = index + 1;
			if (version <= current) continue;
			db.transaction(() => {
				db.exec(sql);
				db.prepare('UPDATE schema_version SET version = ?').run(version);
			})();
			current = version;
		}
	}

	transaction<T>(fn: () => T): T {
		return this.connection.transaction(fn)();
	}
}
