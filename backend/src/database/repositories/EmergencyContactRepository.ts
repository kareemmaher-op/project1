import { Repository } from 'typeorm';
import { EmergencyContact } from '../entities/EmergencyContact';
import { getDatabase } from '../config/database';

export class EmergencyContactRepository {
	private repositoryPromise: Promise<Repository<EmergencyContact>>;

	constructor() {
		this.repositoryPromise = (async () => {
			const db = await getDatabase();
			return db.getRepository(EmergencyContact);
		})();
	}

	async createAndSave(contact: Partial<EmergencyContact>): Promise<EmergencyContact> {
		const repo = await this.repositoryPromise;
		const entity = repo.create(contact);
		return repo.save(entity);
	}

	async findByCaseId(caseId: number): Promise<EmergencyContact[]> {
		const repo = await this.repositoryPromise;
		return repo.find({ where: { case_id: caseId } });
	}

	async existsByEmailInCase(caseId: number, email: string): Promise<boolean> {
		const repo = await this.repositoryPromise;
		const count = await repo.count({ where: { case_id: caseId, email } });
		return count > 0;
	}

    async findByCaseAndEmail(caseId: number, email: string): Promise<EmergencyContact | null> {
        const repo = await this.repositoryPromise;
        return repo.findOne({ where: { case_id: caseId, email } });
    }

    async updateById(contactId: number, updates: Partial<EmergencyContact>): Promise<EmergencyContact | null> {
        const repo = await this.repositoryPromise;
        await repo.update({ contact_id: contactId }, updates);
        const updated = await repo.findOne({ where: { contact_id: contactId } });
        return updated;
    }
}