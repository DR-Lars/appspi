import { env } from '$env/dynamic/private';
import { Database } from './db/Database';
import { EarningRepository } from './repositories/EarningRepository';
import { ClueCardRepository } from './repositories/ClueCardRepository';
import { MysteryRepository } from './repositories/MysteryRepository';
import { SessionRepository } from './repositories/SessionRepository';
import { SettingsRepository } from './repositories/SettingsRepository';
import { UserRepository } from './repositories/UserRepository';
import { AuthService } from './services/AuthService';
import { BudgetService } from './services/BudgetService';
import { ClueCardService } from './services/ClueCardService';
import { LoginThrottle } from './services/LoginThrottle';
import { MysteryService } from './services/MysteryService';
import { PasswordHasher } from './services/PasswordHasher';
import { SettingsService } from './services/SettingsService';
import { UserService } from './services/UserService';

/** Composition root: bouwt alle objecten één keer op en koppelt hun afhankelijkheden. */
export class AppContainer {
	private static instance: AppContainer | null = null;
	private static ready: Promise<void> | null = null;

	readonly auth: AuthService;
	readonly users: UserService;
	readonly settings: SettingsService;
	readonly budget: BudgetService;
	readonly mysteries: MysteryService;
	readonly clueCards: ClueCardService;

	private constructor(databasePath: string) {
		const db = new Database(databasePath);
		const userRepo = new UserRepository(db);
		const sessionRepo = new SessionRepository(db);
		const hasher = new PasswordHasher();

		this.auth = new AuthService(userRepo, sessionRepo, hasher, new LoginThrottle());
		this.users = new UserService(userRepo, sessionRepo, hasher);
		this.settings = new SettingsService(new SettingsRepository(db));
		this.budget = new BudgetService(userRepo, new EarningRepository(db), this.settings);
		const cardRepo = new ClueCardRepository(db);
		this.clueCards = new ClueCardService(cardRepo);
		this.mysteries = new MysteryService(new MysteryRepository(db), cardRepo, userRepo);
	}

	static get(): AppContainer {
		if (!AppContainer.instance) AppContainer.instance = new AppContainer(env.DATABASE_PATH || './data/appspi.db');
		return AppContainer.instance;
	}

	/** Eenmalige initialisatie: admins aanmaken en verlopen sessies opruimen. */
	static init(): Promise<void> {
		if (!AppContainer.ready) {
			const app = AppContainer.get();
			AppContainer.ready = app.users
				.seedAdmins([
					{ username: env.ADMIN1_USERNAME ?? '', name: env.ADMIN1_NAME ?? '', password: env.ADMIN1_PASSWORD ?? '' },
					{ username: env.ADMIN2_USERNAME ?? '', name: env.ADMIN2_NAME ?? '', password: env.ADMIN2_PASSWORD ?? '' }
				])
				.then(() => app.auth.cleanup());
		}
		return AppContainer.ready;
	}
}
