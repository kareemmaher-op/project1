import { PatientRepository, UserRepository, CaseRepository } from '../database/repositories';
import { PatientRegistrationRequest, PatientResponse } from '../types/patient';
import { getTransactionManager } from '../database/config/database';

export class PatientService {
    private patientRepository: PatientRepository;
    private userRepository: UserRepository;
    private caseRepository: CaseRepository;

    constructor() {
        this.patientRepository = new PatientRepository();
        this.userRepository = new UserRepository();
        this.caseRepository = new CaseRepository();
    }

    async createPatient(patientData: PatientRegistrationRequest, userId: number): Promise<PatientResponse> {
        const transactionManager = await getTransactionManager();
        
        return await transactionManager.transaction(async (manager) => {
            // Validate user exists
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Case is required for linking
            const targetCase = await this.caseRepository.findByCaseCode(patientData.case_id);
            if (!targetCase) {
                throw new Error('Case not found');
            }
            // Ownership: case must belong to authenticated user
            if (targetCase.user_id !== userId) {
                throw new Error('Unauthorized: You are not authorized to access this case.');
            }

            // If case already has a patient
            if (targetCase.patient_id) {
                const existingLinked = await this.patientRepository.findById(targetCase.patient_id);
                if (!existingLinked) {
                    throw new Error('Linked patient not found');
                }
                if (existingLinked.user_id !== userId) {
                    throw new Error('Unauthorized: You are not authorized to modify this patient.');
                }
                // Update existing linked patient
                const updated = await this.patientRepository.update(existingLinked.patient_id, {
                    first_name: patientData.first_name,
                    last_name: patientData.last_name,
                    date_of_birth: new Date(patientData.date_of_birth),
                    allergies_medical_history: patientData.allergies_medical_history ?? existingLinked.allergies_medical_history,
                    is_self: patientData.is_self ?? existingLinked.is_self,
                    invite_email: patientData.invite_email ?? existingLinked.invite_email,
                    location: patientData.location,
                    postal_code: patientData.postal_code
                });
                if (!updated) {
                    throw new Error('Failed to update patient');
                }
                // ensure step is set and include workflow_state
                await manager.update('cases', { id: targetCase.id }, { current_step: 'PATIENT_LINKED' });
                return this.mapPatientToResponse(updated, 'PATIENT_LINKED');
            }

            // Try to find existing patient for this user by identity
            const matching = await this.patientRepository.findByIdentity(
                userId,
                patientData.first_name,
                patientData.last_name,
                new Date(patientData.date_of_birth)
            );

            let patient: any = matching;
            if (!patient) {
                // Create new patient
                const patientToCreate = {
                    user_id: userId,
                    first_name: patientData.first_name,
                    last_name: patientData.last_name,
                    date_of_birth: new Date(patientData.date_of_birth),
                    allergies_medical_history: patientData.allergies_medical_history || null,
                    is_self: patientData.is_self || false,
                    invite_email: patientData.invite_email || null,
                    location: patientData.location,
                    postal_code: patientData.postal_code
                };
                patient = await this.patientRepository.create(patientToCreate);
            }

            // Link patient to case and set step to PATIENT_LINKED
            await this.caseRepository.updatePatientAssociation(targetCase.id, patient.patient_id);
            await manager.update('cases', { id: targetCase.id }, {
                current_step: 'PATIENT_LINKED',
                patient_id: patient.patient_id
            });

            return this.mapPatientToResponse(patient, 'PATIENT_LINKED');
        });
    }

    private mapPatientToResponse(patient: any, workflowState?: string): PatientResponse {
        const response: PatientResponse = {
            patient_id: patient.patient_id,
            user_id: patient.user_id,
            first_name: patient.first_name,
            last_name: patient.last_name,
            date_of_birth: patient.date_of_birth,
            allergies_medical_history: patient.allergies_medical_history,
            is_self: patient.is_self,
            invite_email: patient.invite_email,
            location: patient.location,
            postal_code: patient.postal_code,
            created_at: patient.created_at,
            updated_at: patient.updated_at
        };
        if (workflowState) {
            response.workflow_state = workflowState;
        }
        return response;
    }
}