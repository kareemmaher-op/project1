import { Repository } from 'typeorm';
import { EmergencyContact } from '../entities/EmergencyContact';
import { getDatabase } from '../config/database';
import { ErrorHandler } from '../../utils/errorHandler';

export class EmergencyContactRepository {
    private repositoryPromise: Promise<Repository<EmergencyContact>>;

    constructor() {
        this.repositoryPromise = (async () => {
            const db = await getDatabase();
            return db.getRepository(EmergencyContact);
        })();
    }

    async createAndSave(contact: Partial<EmergencyContact>): Promise<EmergencyContact> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repo = await this.repositoryPromise;
            const entity = repo.create(contact);
            return repo.save(entity);
        }, 'createAndSave');
    }

    async findByCaseId(caseId: number): Promise<EmergencyContact[]> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repo = await this.repositoryPromise;
            return repo.find({ where: { case_id: caseId } });
        }, 'findByCaseId');
    }

    async existsByEmailInCase(caseId: number, email: string): Promise<boolean> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repo = await this.repositoryPromise;
            const count = await repo.count({ where: { case_id: caseId, email } });
            return count > 0;
        }, 'existsByEmailInCase');
    }

    async findByCaseAndEmail(caseId: number, email: string): Promise<EmergencyContact | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repo = await this.repositoryPromise;
            return repo.findOne({ where: { case_id: caseId, email } });
        }, 'findByCaseAndEmail');
    }

    async updateById(contactId: number, updates: Partial<EmergencyContact>): Promise<EmergencyContact | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repo = await this.repositoryPromise;
            const existing = await repo.findOne({ where: { contact_id: contactId } });
            ErrorHandler.ensureFound(existing, 'EmergencyContact');

            await repo.update({ contact_id: contactId }, updates);
            const updated = await repo.findOne({ where: { contact_id: contactId } });
            return updated;
        }, 'updateById');
    }

    async delete(id: number): Promise<boolean> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repo = await this.repositoryPromise;
            const existing = await repo.findOne({ where: { contact_id: id } });
            ErrorHandler.ensureFound(existing, 'EmergencyContact');

            const result = await repo.softDelete(id);
            return result.affected !== undefined && result.affected > 0;
        }, 'delete');
    }
}