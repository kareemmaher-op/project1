import { UserRepository } from '../database/repositories';

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