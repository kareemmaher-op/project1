import { Repository } from 'typeorm';
import { NotificationPreference } from '../entities/NotificationPreference';
import { getDatabase } from '../config/database';

export class NotificationPreferenceRepository {
    private async getRepository(): Promise<Repository<NotificationPreference>> {
        const db = await getDatabase();
        return db.getRepository(NotificationPreference);
    }

    async create(notificationData: Partial<NotificationPreference>): Promise<NotificationPreference> {
        const repository = await this.getRepository();
        const notification = repository.create(notificationData);
        return await repository.save(notification);
    }

    async findByUserAndCaseAndType(
        userId: number, 
        caseId: number, 
        type: string
    ): Promise<NotificationPreference | null> {
        const repository = await this.getRepository();
        return await repository.findOne({
            where: {
                user_id: userId,
                case_id: caseId,
                type: type
            }
        });
    }

    async findByUserAndCase(userId: number, caseId: number): Promise<NotificationPreference[]> {
        const repository = await this.getRepository();
        return await repository.find({
            where: {
                user_id: userId,
                case_id: caseId
            }
        });
    }

    async findByUserId(userId: number): Promise<NotificationPreference[]> {
        const repository = await this.getRepository();
        return await repository.find({
            where: { user_id: userId },
            relations: ['case']
        });
    }

    async update(id: number, notificationData: Partial<NotificationPreference>): Promise<NotificationPreference | null> {
        const repository = await this.getRepository();
        await repository.update(id, notificationData);
        return await repository.findOne({ where: { notification_pref_id: id } });
    }

    async upsert(
        userId: number,
        caseId: number,
        type: string,
        notificationData: Partial<NotificationPreference>
    ): Promise<NotificationPreference> {
        const repository = await this.getRepository();
        
        // Try to find existing notification preference
        const existing = await this.findByUserAndCaseAndType(userId, caseId, type);
        
        if (existing) {
            // Update existing
            return await this.update(existing.notification_pref_id, {
                delivery_method: notificationData.delivery_method,
                enabled: notificationData.enabled,
                alert_schedule: notificationData.alert_schedule
            }) as NotificationPreference;
        } else {
            // Create new
            return await this.create({
                user_id: userId,
                case_id: caseId,
                type: type,
                delivery_method: notificationData.delivery_method,
                enabled: notificationData.enabled,
                alert_schedule: notificationData.alert_schedule
            });
        }
    }

    async delete(id: number): Promise<boolean> {
        const repository = await this.getRepository();
        const result = await repository.softDelete(id);
        return result.affected !== undefined && result.affected > 0;
    }

    async deleteByUserAndCaseAndType(userId: number, caseId: number, type: string): Promise<boolean> {
        const repository = await this.getRepository();
        const result = await repository.softDelete({
            user_id: userId,
            case_id: caseId,
            type: type
        });
        return result.affected !== undefined && result.affected > 0;
    }
}