import { MedicationRepository, CaseRepository, UserRepository } from '../database/repositories';
import { MedicationRegistrationRequest, MedicationResponse } from '../types/medication';
import { getTransactionManager } from '../database/config/database';

export class MedicationService {
    private medicationRepository: MedicationRepository;
    private caseRepository: CaseRepository;
    private userRepository: UserRepository;

    constructor() {
        this.medicationRepository = new MedicationRepository();
        this.caseRepository = new CaseRepository();
        this.userRepository = new UserRepository();
    }

    async createMedication(medicationData: MedicationRegistrationRequest, userId: number): Promise<MedicationResponse> {
        const transactionManager = await getTransactionManager();
        
        return await transactionManager.transaction(async (manager) => {
            // Validate user exists
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Resolve and validate case by client-provided case code
            const caseEntity = await this.caseRepository.findByCaseCode(medicationData.case_id);
            if (!caseEntity) {
                throw new Error('Case not found');
            }

            // Ownership check
            if (caseEntity.user_id !== userId) {
                throw new Error('Unauthorized: You are not authorized to access this case.');
            }

            // Check step: allow if PATIENT_LINKED or already DEVICE_LINKED/MEDICAL_LINKED
            const allowedSteps = ['PATIENT_LINKED', 'MEDICAL_LINKED', 'DEVICE_LINKED'];
            if (!caseEntity.current_step || !allowedSteps.includes(caseEntity.current_step)) {
                throw new Error('Invalid request: invalid workflow step');
            }

            // Upsert by case and spray_number
            const existingMedication = await this.medicationRepository.findByCaseAndSprayNumber(
                caseEntity.id, 
                medicationData.spray_number
            );

            let medication;
            if (existingMedication) {
                // Update existing
                medication = await this.medicationRepository.update(existingMedication.spray_id, {
                    case_id: caseEntity.id,
                    spray_number: medicationData.spray_number,
                    // keep existing status if provided, otherwise default pending
                    status: existingMedication.status || 'pending',
                    expiration_date_spray_1: new Date(medicationData.expiration_date_spray_1),
                    lot_number_spray_1: medicationData.lot_number_spray_1 ?? existingMedication.lot_number_spray_1 ?? null,
                    expiration_date_spray_2: new Date(medicationData.expiration_date_spray_2),
                    lot_number_spray_2: medicationData.lot_number_spray_2 ?? existingMedication.lot_number_spray_2 ?? null,
                    dosage_details: medicationData.dosage_details ?? existingMedication.dosage_details ?? null
                });
                if (!medication) {
                    throw new Error('Failed to update medication');
                }
            } else {
                // Create new
                medication = await this.medicationRepository.create({
                    case_id: caseEntity.id,
                    spray_number: medicationData.spray_number,
                    status: 'pending',
                    expiration_date_spray_1: new Date(medicationData.expiration_date_spray_1),
                    lot_number_spray_1: medicationData.lot_number_spray_1 || null,
                    expiration_date_spray_2: new Date(medicationData.expiration_date_spray_2),
                    lot_number_spray_2: medicationData.lot_number_spray_2 || null,
                    dosage_details: medicationData.dosage_details || null
                });
            }

            // Update case step to MEDICAL_LINKED after medication save
            await manager.update('cases', { id: caseEntity.id }, { 
                current_step: 'MEDICAL_LINKED'
            });

            const response = this.mapMedicationToResponse(medication);
            response.workflow_state = 'MEDICAL_LINKED';
            return response;
        });
    }

    private mapMedicationToResponse(medication: any): MedicationResponse {
        return {
            spray_id: medication.spray_id,
            case_id: medication.case_id,
            spray_number: medication.spray_number,
            status: medication.status,
            expiration_date_spray_1: medication.expiration_date_spray_1,
            lot_number_spray_1: medication.lot_number_spray_1,
            expiration_date_spray_2: medication.expiration_date_spray_2,
            lot_number_spray_2: medication.lot_number_spray_2,
            dosage_details: medication.dosage_details,
            created_at: medication.created_at,
            updated_at: medication.updated_at
        };
    }
}