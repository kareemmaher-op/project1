import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { getDatabase } from '../config/database';
import { ErrorHandler } from '../../utils/errorHandler';

export class UserRepository {
    private async getRepository(): Promise<Repository<User>> {
        const db = await getDatabase();
        return db.getRepository(User);
    }

    async create(userData: Partial<User>): Promise<User> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const user = repository.create(userData);
            return await repository.save(user);
        }, 'create');
    }

    async findById(id: number): Promise<User | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            return await repository.findOne({
                where: { user_id: id },
                select: ['user_id', 'first_name', 'last_name', 'email', 'entra_oid', 'account_status', 'first_login_completed']
            });
        }, 'findById');
    }

    async findByEmail(email: string): Promise<User | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            return await repository.findOne({
                where: { email },
                select: ['user_id', 'first_name', 'last_name', 'email', 'password_hash', 'entra_oid', 'account_status']
            });
        }, 'findByEmail');
    }

    async findByEntraOid(entraOid: string): Promise<User | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            return await repository.findOne({
                where: { entra_oid: entraOid },
                select: ['user_id', 'first_name', 'last_name', 'email', 'entra_oid', 'account_status', 'first_login_completed']
            });
        }, 'findByEntraOid');
    }

    async findAll(page: number = 1, limit: number = 10): Promise<{ users: User[], total: number }> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const [users, total] = await repository.findAndCount({
                skip: (page - 1) * limit,
                take: limit,
                select: ['user_id', 'first_name', 'last_name', 'email']
            });
            return { users, total };
        }, 'findAll');
    }

    async update(id: number, userData: Partial<User>): Promise<User | null> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const existing = await repository.findOne({ where: { user_id: id } });
            ErrorHandler.ensureFound(existing, 'User');

            await repository.update(id, userData);
            return await this.findById(id);
        }, 'update');
    }

    async delete(id: number): Promise<boolean> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const existing = await repository.findOne({ where: { user_id: id } });
            ErrorHandler.ensureFound(existing, 'User');

            const result = await repository.softDelete(id);
            return result.affected !== undefined && result.affected > 0;
        }, 'delete');
    }

    async existsByEmail(email: string, excludeId?: number): Promise<boolean> {
        return await ErrorHandler.wrapDatabaseOperation(async () => {
            const repository = await this.getRepository();
            const query = repository.createQueryBuilder('user')
                .where('user.email = :email', { email });

            if (excludeId) {
                query.andWhere('user.user_id != :excludeId', { excludeId });
            }

            const count = await query.getCount();
            return count > 0;
        }, 'existsByEmail');
    }
}