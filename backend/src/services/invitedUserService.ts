import { InvitedUserRepository } from '../database/repositories/InvitedUserRepository';
import { CaseRepository, UserRepository } from '../database/repositories';

export class InvitedUserService {
	private invitedUserRepository: InvitedUserRepository;
    private caseRepository: CaseRepository;
    private userRepository: UserRepository;

	constructor() {
		this.invitedUserRepository = new InvitedUserRepository();
        this.caseRepository = new CaseRepository();
        this.userRepository = new UserRepository();
	}

	async inviteUserToCase(caseId: number, email: string, authenticatedUserId: number) {
		const exists = await this.invitedUserRepository.existsEmailForCase(caseId, email);
		if (exists) {
			throw new Error('Conflict: Invitation already exists for this case');
		}
		return this.invitedUserRepository.createAndSave({ case_id: caseId, user_id: null, email });
	}

	async inviteUsersToCase(caseId: number, emails: string[], authenticatedUserId: number) {
		const created: Array<{ email: string }> = [];
		const skipped: Array<{ email: string; reason: string }> = [];
		for (const email of emails) {
			const exists = await this.invitedUserRepository.existsEmailForCase(caseId, email);
			if (exists) {
				skipped.push({ email, reason: 'Invitation already exists for this case' });
				continue;
			}
			await this.invitedUserRepository.createAndSave({ case_id: caseId, user_id: null, email });
			created.push({ email });
		}
		return { created, skipped };
	}

    private async resolveAuthorizedCaseId(caseCode: string, authenticatedUserId: number): Promise<number> {
        const user = await this.userRepository.findById(authenticatedUserId);
        if (!user) {
            throw new Error('User not found');
        }
        const caseEntity = await this.caseRepository.findByCaseCode(caseCode);
        if (!caseEntity) {
            throw new Error('Case not found');
        }
        if (caseEntity.user_id !== authenticatedUserId) {
            throw new Error('Unauthorized: You are not authorized to access this case.');
        }
        return caseEntity.id;
    }

    async inviteUserToCaseByCaseCode(caseCode: string, email: string, authenticatedUserId: number) {
        const caseId = await this.resolveAuthorizedCaseId(caseCode, authenticatedUserId);
        return this.inviteUserToCase(caseId, email, authenticatedUserId);
    }

    async inviteUsersToCaseByCaseCode(caseCode: string, emails: string[], authenticatedUserId: number) {
        const caseId = await this.resolveAuthorizedCaseId(caseCode, authenticatedUserId);
        return this.inviteUsersToCase(caseId, emails, authenticatedUserId);
    }
}