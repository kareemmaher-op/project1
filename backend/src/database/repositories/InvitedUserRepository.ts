import { Repository } from 'typeorm';
import { InvitedUser } from '../entities/InvitedUser';
import { getDatabase } from '../config/database';

export class InvitedUserRepository {
	private repositoryPromise: Promise<Repository<InvitedUser>>;

	constructor() {
		this.repositoryPromise = (async () => {
			const db = await getDatabase();
			return db.getRepository(InvitedUser);
		})();
	}

	async createAndSave(invite: Partial<InvitedUser>): Promise<InvitedUser> {
		const repo = await this.repositoryPromise;
		const entity = repo.create(invite);
		return repo.save(entity);
	}

	async existsEmailForCase(caseId: number, email: string): Promise<boolean> {
		const repo = await this.repositoryPromise;
		const count = await repo.count({ where: { case_id: caseId, email } });
		return count > 0;
	}
}