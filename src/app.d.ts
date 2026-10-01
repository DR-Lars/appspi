import type { User } from '$lib/server/domain/User';

declare global {
	namespace App {
		interface Locals {
			user: User | null;
		}
		interface Error {
			message: string;
		}
	}
}

export {};
