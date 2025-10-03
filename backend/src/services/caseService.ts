import { CaseRepository, UserRepository } from '../database/repositories';
import { CaseRegistrationRequest, CaseResponse } from '../types/case';
import { getTransactionManager } from '../database/config/database';

export class CaseService {
    private caseRepository: CaseRepository;

    constructor() {
        this.caseRepository = new CaseRepository();
    }

    async createCase(caseData: CaseRegistrationRequest, userId: number): Promise<CaseResponse> {
        const transactionManager = await getTransactionManager();

        return await transactionManager.transaction(async (_manager) => {
            // Validate user exists (avoid FK violation)
            const userRepo = new UserRepository();
            const user = await userRepo.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            // If a case with this client-provided case_id exists
            const existing = await this.caseRepository.findByCaseCode(caseData.case_id);
            if (existing) {
                // Ensure ownership
                if (existing.user_id !== userId) {
                    throw new Error('Conflict: case already exists');
                }
                // Update existing case fields (no workflow transitions here)
                const updated = await this.caseRepository.update(caseData.case_id, {
                    case_name: caseData.case_name,
                    battery_level: caseData.battery_level ?? existing.battery_level,
                    connection_status: caseData.connection_status ?? existing.connection_status
                });
                if (!updated) {
                    throw new Error('Internal error: failed to update case');
                }
                return this.mapCaseToResponse(updated);
            }

            // Create new case with client case_id
            const caseToCreate = {
                case_id: caseData.case_id,
                patient_id: null,
                user_id: userId,
                case_name: caseData.case_name,
                current_step: 'CREATED',
                battery_level: caseData.battery_level ?? null,
                last_seen: null,
                connection_status: caseData.connection_status ?? 'disconnected'
            };

            const created = await this.caseRepository.create(caseToCreate);
            return this.mapCaseToResponse(created);
        });
    }

    async getCaseByCaseCode(caseCode: string): Promise<CaseResponse | null> {
        const caseEntity = await this.caseRepository.findByCaseCode(caseCode);
        if (!caseEntity) {
            return null;
        }
        return this.mapCaseToResponse(caseEntity);
    }

    async getUserCases(userId: number): Promise<CaseResponse[]> {
        const caseEntities = await this.caseRepository.findByUserId(userId);
        return caseEntities.map(caseEntity => this.mapCaseToResponse(caseEntity));
    }

    private mapCaseToResponse(caseEntity: any): CaseResponse {
        return {
            case_id: caseEntity.case_id,
            patient_id: caseEntity.patient_id,
            case_name: caseEntity.case_name,
            battery_level: caseEntity.battery_level ?? null,
            last_seen: caseEntity.last_seen ?? null,
            connection_status: caseEntity.connection_status ?? null,
            workflow_state: caseEntity.current_step ?? undefined,
            patient: caseEntity.patient ? {
                patient_id: caseEntity.patient.patient_id,
                first_name: caseEntity.patient.first_name,
                last_name: caseEntity.patient.last_name,
                user_id: caseEntity.patient.user_id
            } : undefined
        };
    }
} 