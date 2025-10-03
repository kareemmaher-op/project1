import { EmergencyContactRepository } from '../database/repositories/EmergencyContactRepository';
import { InvitedUserRepository } from '../database/repositories/InvitedUserRepository';
import { CaseRepository, UserRepository } from '../database/repositories';
import { getTransactionManager } from '../database/config/database';
import { EmergencyContact } from '../database/entities/EmergencyContact';

export interface CreateEmergencyContactsOptions {
    caseCode: string;
    contacts: Array<{
        first_name: string;
        last_name: string;
        email: string;
        phone_number: string;
        send_invite?: boolean;
    }>;
    createdByUserId: number;
}

export class EmergencyContactService {
    private emergencyContactRepository: EmergencyContactRepository;
    private invitedUserRepository: InvitedUserRepository;
    private caseRepository: CaseRepository;
    private userRepository: UserRepository;

    constructor() {
        this.emergencyContactRepository = new EmergencyContactRepository();
        this.invitedUserRepository = new InvitedUserRepository();
        this.caseRepository = new CaseRepository();
        this.userRepository = new UserRepository();
    }

    async createEmergencyContacts(options: CreateEmergencyContactsOptions): Promise<{ saved: EmergencyContact[]; skipped: Array<{ email: string; reason: string }>; workflow_state: string; message: string; }>{
        const { caseCode, contacts, createdByUserId } = options;

        const transactionManager = await getTransactionManager();
        return await transactionManager.transaction(async (manager) => {
            const user = await this.userRepository.findById(createdByUserId);
            if (!user) {
                throw new Error('User not found');
            }
            const caseEntity = await this.caseRepository.findByCaseCode(caseCode);
            if (!caseEntity) {
                throw new Error('Case not found');
            }
            if (caseEntity.user_id !== createdByUserId) {
                throw new Error('Unauthorized: You are not authorized to access this case.');
            }
            const caseId = caseEntity.id;

            const saved: EmergencyContact[] = [];
            const skipped: Array<{ email: string; reason: string }> = [];

            for (const c of contacts) {
                const existing = await this.emergencyContactRepository.findByCaseAndEmail(caseId, c.email);
                if (existing) {
                    const updated = await this.emergencyContactRepository.updateById(existing.contact_id, {
                        first_name: c.first_name,
                        last_name: c.last_name,
                        phone_number: c.phone_number,
                        invite_sent: !!c.send_invite
                    });
                    if (updated) saved.push(updated);
                } else {
                    const contact = await this.emergencyContactRepository.createAndSave({
                        case_id: caseId,
                        first_name: c.first_name,
                        last_name: c.last_name,
                        email: c.email,
                        phone_number: c.phone_number,
                        invite_sent: !!c.send_invite
                    });
                    saved.push(contact);
                }

                if (c.send_invite) {
                    // create invited user entry if not already exists for this case/email
                    const inviteExists = await this.invitedUserRepository.existsEmailForCase(caseId, c.email);
                    if (!inviteExists) {
                        await this.invitedUserRepository.createAndSave({
                            case_id: caseId,
                            user_id: null,
                            email: c.email,
                        });
                    }
                }
            }

            // Update case workflow step after successfully processing contacts
            await manager.update('cases', { id: caseId }, { current_step: 'EMERGENCY_CONTACTS_ADDED' });

            return {
                saved,
                skipped,
                workflow_state: 'EMERGENCY_CONTACTS_ADDED',
                message: `Successfully processed ${saved.length} emergency contacts for case ${caseCode}. Case updated to EMERGENCY_CONTACTS_ADDED.`
            };
        });
    }
}