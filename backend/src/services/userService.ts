import { UserRepository } from '../database/repositories';
import { User } from '../database/entities';

interface CreateUserData {
    entra_oid: string;
    email: string;
    first_name: string;
    last_name: string;
    account_status?: 'incomplete' | 'complete';
    first_login_completed?: boolean;
}

export class UserService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async getUserById(userId: number) {
        return await this.userRepository.findById(userId);
    }

    async getUserByEmail(email: string) {
        return await this.userRepository.findByEmail(email);
    }

    async getUserByEntraOid(entraOid: string): Promise<User | null> {
        return await this.userRepository.findByEntraOid(entraOid);
    }

    async createUser(userData: CreateUserData): Promise<User> {
        // Check if user already exists with this Entra OID
        const existingUser = await this.getUserByEntraOid(userData.entra_oid);
        if (existingUser) {
            throw new Error('User already exists with this Entra ID');
        }

        // Check if user already exists with this email
        const existingEmailUser = await this.getUserByEmail(userData.email);
        if (existingEmailUser) {
            throw new Error('User already exists with this email');
        }

        return await this.userRepository.create({
            ...userData,
            account_status: userData.account_status || 'incomplete'
        });
    }

    async updateUserStatus(entraOid: string, status: 'incomplete' | 'complete'): Promise<User> {
        const user = await this.getUserByEntraOid(entraOid);
        if (!user) {
            throw new Error('User not found');
        }

        const updated = await this.userRepository.update(user.user_id, {
            account_status: status
        });

        if (!updated) {
            throw new Error('Failed to update user status');
        }

        return updated;
    }

    async markFirstLoginCompleted(entraOid: string): Promise<User> {
        const user = await this.getUserByEntraOid(entraOid);
        if (!user) {
            throw new Error('User not found');
        }

        const updated = await this.userRepository.update(user.user_id, {
            first_login_completed: true
        });

        if (!updated) {
            throw new Error('Failed to mark first login as completed');
        }

        return updated;
    }

    async getProfile(userId: number): Promise<{ userId: number; firstName: string; lastName: string; email: string; }> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('Unauthorized: user not found');
        }
        return {
            userId: user.user_id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
        };
    }
}