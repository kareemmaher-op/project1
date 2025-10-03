import { Repository } from 'typeorm';
import { InvitedUser } from '../entities/InvitedUser';
import { getDatabase } from '../config/database';
import { ErrorHandler } from '../../utils/errorHandler';

export class InvitedUserRepository {
    private repositoryPromise: Promise<Repository<InvitedUser>>;

    constructor() {
        this.repositoryPromise = (async () => {
            const db = await getDatabase();
            return db.getRepository(InvitedUser);
        })();
    }

    async createAndSave(invite: Partial<InvitedUser>): Promise<InvitedUser> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repo = await this.repositoryPromise;
            const entity = repo.create(invite);
            return repo.save(entity);
        }, 'createAndSave');
    }

    async existsEmailForCase(caseId: number, email: string): Promise<boolean> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repo = await this.repositoryPromise;
            const count = await repo.count({ where: { case_id: caseId, email } });
            return count > 0;
        }, 'existsEmailForCase');
    }

    async findById(id: number): Promise<InvitedUser | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repo = await this.repositoryPromise;
            return await repo.findOne({
                where: { invited_user_id: id },
                relations: ['case', 'user']
            });
        }, 'findById');
    }

    async findByCaseId(caseId: number): Promise<InvitedUser[]> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repo = await this.repositoryPromise;
            return await repo.find({
                where: { case_id: caseId },
                relations: ['user']
            });
        }, 'findByCaseId');
    }

    async update(id: number, updates: Partial<InvitedUser>): Promise<InvitedUser | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repo = await this.repositoryPromise;
            const existing = await repo.findOne({ where: { invited_user_id: id } });
            ErrorHandler.ensureFound(existing, 'InvitedUser');

            await repo.update({ invited_user_id: id }, updates);
            return await this.findById(id);
        }, 'update');
    }

    async delete(id: number): Promise<boolean> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repo = await this.repositoryPromise;
            const existing = await repo.findOne({ where: { invited_user_id: id } });
            ErrorHandler.ensureFound(existing, 'InvitedUser');

            const result = await repo.softDelete(id);
            return result.affected !== undefined && result.affected > 0;
        }, 'delete');
    }
}