import { CaseRepository } from '../database/repositories';

export class AuthorizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AuthorizationError';
    }
}

export class Authorization {
    /**
     * Verify that a user owns or has access to a case
     */
    static async verifyCaseAccess(caseCode: string, userId: number): Promise<number> {
        const caseRepository = new CaseRepository();
        const caseEntity = await caseRepository.findByCaseCode(caseCode);

        if (!caseEntity) {
            throw new Error('Case not found');
        }

        if (caseEntity.user_id !== userId) {
            throw new AuthorizationError('Unauthorized: You do not have access to this case');
        }

        return caseEntity.id;
    }

    /**
     * Verify case access and return the full case entity
     */
    static async verifyCaseAccessWithEntity(caseCode: string, userId: number) {
        const caseRepository = new CaseRepository();
        const caseEntity = await caseRepository.findByCaseCode(caseCode);

        if (!caseEntity) {
            throw new Error('Case not found');
        }

        if (caseEntity.user_id !== userId) {
            throw new AuthorizationError('Unauthorized: You do not have access to this case');
        }

        return caseEntity;
    }

    /**
     * Check if user has permission to perform an action
     * This is a placeholder for future role-based access control (RBAC)
     */
    static async hasPermission(_userId: number, _resource: string, _action: string): Promise<boolean> {
        // TODO: Implement RBAC when roles are added to the system
        // For now, all authenticated users have all permissions
        return true;
    }

    /**
     * Verify that a user ID is valid and exists
     */
    static validateUserId(userId: number | null | undefined): number {
        if (!userId || isNaN(userId)) {
            throw new AuthorizationError('Invalid or missing user ID');
        }
        return userId;
    }
}
