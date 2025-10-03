import { Repository } from 'typeorm';
import { NotificationPreference } from '../entities/NotificationPreference';
import { getDatabase } from '../config/database';
import { ErrorHandler } from '../../utils/errorHandler';

export class NotificationPreferenceRepository {
    private async getRepository(): Promise<Repository<NotificationPreference>> {
        const db = await getDatabase();
        return db.getRepository(NotificationPreference);
    }

    async create(notificationData: Partial<NotificationPreference>): Promise<NotificationPreference> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const notification = repository.create(notificationData);
            return await repository.save(notification);
        }, 'create');
    }

    async findByUserAndCaseAndType(
        userId: number,
        caseId: number,
        type: string
    ): Promise<NotificationPreference | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            return await repository.findOne({
                where: {
                    user_id: userId,
                    case_id: caseId,
                    type: type
                }
            });
        }, 'findByUserAndCaseAndType');
    }

    async findByUserAndCase(userId: number, caseId: number): Promise<NotificationPreference[]> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            return await repository.find({
                where: {
                    user_id: userId,
                    case_id: caseId
                }
            });
        }, 'findByUserAndCase');
    }

    async findByUserId(userId: number): Promise<NotificationPreference[]> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            return await repository.find({
                where: { user_id: userId },
                relations: ['case']
            });
        }, 'findByUserId');
    }

    async update(id: number, notificationData: Partial<NotificationPreference>): Promise<NotificationPreference | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const existing = await repository.findOne({ where: { notification_pref_id: id } });
            ErrorHandler.ensureFound(existing, 'NotificationPreference');

            await repository.update(id, notificationData);
            return await repository.findOne({ where: { notification_pref_id: id } });
        }, 'update');
    }

    async upsert(
        userId: number,
        caseId: number,
        type: string,
        notificationData: Partial<NotificationPreference>
    ): Promise<NotificationPreference> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            // Try to find existing notification preference
            const existing = await this.findByUserAndCaseAndType(userId, caseId, type);

            if (existing) {
                // Update existing
                return await this.update(existing.notification_pref_id, {
                    delivery_method: notificationData.delivery_method,
                    enabled: notificationData.enabled
                }) as NotificationPreference;
            } else {
                // Create new
                return await this.create({
                    user_id: userId,
                    case_id: caseId,
                    type: type,
                    delivery_method: notificationData.delivery_method,
                    enabled: notificationData.enabled
                });
            }
        }, 'upsert');
    }

    async delete(id: number): Promise<boolean> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const existing = await repository.findOne({ where: { notification_pref_id: id } });
            ErrorHandler.ensureFound(existing, 'NotificationPreference');

            const result = await repository.softDelete(id);
            return result.affected !== undefined && result.affected > 0;
        }, 'delete');
    }

    async deleteByUserAndCaseAndType(userId: number, caseId: number, type: string): Promise<boolean> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const existing = await repository.findOne({
                where: {
                    user_id: userId,
                    case_id: caseId,
                    type: type
                }
            });
            ErrorHandler.ensureFound(existing, 'NotificationPreference');

            const result = await repository.softDelete({
                user_id: userId,
                case_id: caseId,
                type: type
            });
            return result.affected !== undefined && result.affected > 0;
        }, 'deleteByUserAndCaseAndType');
    }
}