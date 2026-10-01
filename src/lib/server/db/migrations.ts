/** Opeenvolgende schema-migraties. Voeg nieuwe migraties enkel achteraan toe. */
export const migrations: string[] = [
	`
	CREATE TABLE users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE COLLATE NOCASE,
		display_name TEXT NOT NULL,
		password_hash TEXT NOT NULL,
		role TEXT NOT NULL CHECK (role IN ('admin','lid')) DEFAULT 'lid',
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE sessions (
		id TEXT PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		expires_at INTEGER NOT NULL
	);

	CREATE TABLE deposits (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		amount_cents INTEGER NOT NULL,
		note TEXT NOT NULL DEFAULT '',
		date TEXT NOT NULL,
		created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE earnings (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
		date TEXT NOT NULL,
		created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE earning_participants (
		earning_id INTEGER NOT NULL REFERENCES earnings(id) ON DELETE CASCADE,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		share_cents INTEGER NOT NULL,
		PRIMARY KEY (earning_id, user_id)
	);

	CREATE TABLE settings (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL
	);

	CREATE TABLE mysteries (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		story TEXT NOT NULL DEFAULT '',
		solution TEXT NOT NULL,
		status TEXT NOT NULL CHECK (status IN ('concept','actief','opgelost','gesloten')) DEFAULT 'concept',
		max_guesses INTEGER NOT NULL DEFAULT 3,
		winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
		started_at TEXT,
		ended_at TEXT,
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE TABLE hints (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		mystery_id INTEGER NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
		position INTEGER NOT NULL,
		text TEXT NOT NULL,
		released_at TEXT
	);

	CREATE TABLE guesses (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		mystery_id INTEGER NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		text TEXT NOT NULL,
		correct INTEGER NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE INDEX idx_deposits_user ON deposits(user_id);
	CREATE INDEX idx_participants_user ON earning_participants(user_id);
	CREATE INDEX idx_hints_mystery ON hints(mystery_id, position);
	CREATE INDEX idx_guesses_mystery ON guesses(mystery_id);
	`,
	// v2: al het geld komt uit activiteiten; persoonlijke stortingen bestaan niet meer.
	`
	DROP INDEX IF EXISTS idx_deposits_user;
	DROP TABLE IF EXISTS deposits;
	`,
	// v3: Cluedo met kaarten (personen, voorwerpen, locaties) i.p.v. vrije tekst.
	// Oude tekst-mysteries zijn niet compatibel en worden verwijderd.
	`
	DELETE FROM mysteries;

	CREATE TABLE clue_cards (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		kind TEXT NOT NULL CHECK (kind IN ('persoon','voorwerp','locatie')),
		name TEXT NOT NULL,
		active INTEGER NOT NULL DEFAULT 1,
		UNIQUE (kind, name)
	);

	INSERT INTO clue_cards (kind, name) VALUES
		('persoon', 'De Barman'),
		('persoon', 'De Surfleraar'),
		('persoon', 'De Hotelreceptionist'),
		('persoon', 'De Taxichauffeur'),
		('persoon', 'De Zonnebrilverkoper'),
		('persoon', 'De Reisleider'),
		('voorwerp', 'Parasol'),
		('voorwerp', 'Zonnebrandcrème'),
		('voorwerp', 'Surfplank'),
		('voorwerp', 'Sangriakan'),
		('voorwerp', 'Slipper'),
		('voorwerp', 'Selfiestick'),
		('voorwerp', 'Opblaasflamingo'),
		('voorwerp', 'Strandbal'),
		('voorwerp', 'Sardinespies'),
		('locatie', 'Praia da Oura'),
		('locatie', 'Praia dos Pescadores'),
		('locatie', 'Praia da Falésia'),
		('locatie', 'De Oude Stad'),
		('locatie', 'De Strip'),
		('locatie', 'De Jachthaven'),
		('locatie', 'Het Hotelzwembad'),
		('locatie', 'De Strandbar'),
		('locatie', 'Het Uitkijkpunt');

	CREATE TABLE mystery_cards (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		mystery_id INTEGER NOT NULL REFERENCES mysteries(id) ON DELETE CASCADE,
		kind TEXT NOT NULL CHECK (kind IN ('persoon','voorwerp','locatie')),
		name TEXT NOT NULL,
		is_member INTEGER NOT NULL DEFAULT 0,
		eliminated_at TEXT
	);
	CREATE INDEX idx_mystery_cards ON mystery_cards(mystery_id, kind);

	ALTER TABLE mysteries ADD COLUMN solution_person INTEGER;
	ALTER TABLE mysteries ADD COLUMN solution_object INTEGER;
	ALTER TABLE mysteries ADD COLUMN solution_location INTEGER;
	ALTER TABLE hints ADD COLUMN card_id INTEGER;
	ALTER TABLE guesses ADD COLUMN person_id INTEGER;
	ALTER TABLE guesses ADD COLUMN object_id INTEGER;
	ALTER TABLE guesses ADD COLUMN location_id INTEGER;
	`
];
