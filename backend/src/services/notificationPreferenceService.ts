import { NotificationPreferenceRepository, CaseRepository, UserRepository } from '../database/repositories';
import { NotificationPreferencesRequest, NotificationPreferencesResponse, NOTIFICATION_TYPES } from '../types/notification';
import { getTransactionManager } from '../database/config/database';

export class NotificationPreferenceService {
    private notificationRepository: NotificationPreferenceRepository;
    private caseRepository: CaseRepository;
    private userRepository: UserRepository;

    constructor() {
        this.notificationRepository = new NotificationPreferenceRepository();
        this.caseRepository = new CaseRepository();
        this.userRepository = new UserRepository();
    }

    async createNotificationPreferences(
        preferencesData: NotificationPreferencesRequest, 
        userId: number
    ): Promise<NotificationPreferencesResponse> {
        const transactionManager = await getTransactionManager();
        
        return await transactionManager.transaction(async (manager) => {
            // Validate user exists
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            const createdPreferences = [];
            const updatedPreferences = [];
            const processedCases = new Map(); // Track cases and their expected notification count

            // Process each notification preference
            for (const prefData of preferencesData.notification_preferences) {
                // Validate case exists and user has access to it
                const targetCase = await this.caseRepository.findByCaseCode(prefData.case_id);
                if (!targetCase) {
                    throw new Error(`Case with ID ${prefData.case_id} not found`);
                }

                // Ownership: case must belong to authenticated user
                if (targetCase.user_id !== userId) {
                    throw new Error(`Unauthorized: You are not authorized to access case ${prefData.case_id}`);
                }

                // Check step: allow if case is in appropriate workflow state
                const allowedSteps = ['CREATED', 'PATIENT_LINKED', 'MEDICAL_LINKED', 'DEVICE_LINKED', 'NOTIFICATIONS_CONFIGURED'];
                if (!allowedSteps.includes(targetCase.current_step || 'CREATED')) {
                    throw new Error(`Invalid request: case must be in a valid workflow state to configure notifications. Current step: ${targetCase.current_step}`);
                }

                // Track this case - we expect to create/update all 7 notification types for it
                processedCases.set(targetCase.id, {
                    caseId: targetCase.id,
                    caseCode: targetCase.case_id,
                    expectedCount: NOTIFICATION_TYPES.length,
                    actualCount: 0
                });

                // Create/Update notification preferences for each of the 7 types
                for (const notificationType of NOTIFICATION_TYPES) {
                    const existingPreference = await this.notificationRepository.findByUserAndCaseAndType(
                        userId,
                        targetCase.id,
                        notificationType
                    );

                    // Support multi-channel: prefer delivery_methods (array); fallback to legacy delivery_method (string)
                    const methodsArray = (prefData as any).delivery_methods as string[] | undefined;
                    const methodsValue = prefData.enabled
                        ? (Array.isArray(methodsArray)
                            ? methodsArray.join(',')
                            : (prefData.delivery_method || null))
                        : null;

                    const preferenceData = {
                        delivery_method: methodsValue,
                        enabled: prefData.enabled,
                        alert_schedule: prefData.alert_schedule || null
                    };

                    let savedPreference;
                    if (existingPreference) {
                        // Update existing preference
                        savedPreference = await this.notificationRepository.update(
                            existingPreference.notification_pref_id,
                            preferenceData
                        );
                        if (!savedPreference) {
                            throw new Error(`Failed to update notification preference for type: ${notificationType}`);
                        }
                        updatedPreferences.push(savedPreference);
                    } else {
                        // Create new preference
                        savedPreference = await this.notificationRepository.create({
                            user_id: userId,
                            case_id: targetCase.id,
                            type: notificationType,
                            ...preferenceData
                        });
                        createdPreferences.push(savedPreference);
                    }

                    // Increment actual count for this case
                    const caseInfo = processedCases.get(targetCase.id);
                    caseInfo.actualCount++;
                }
            }

            // Get all updated/created preferences for response
            const allPreferences = [...createdPreferences, ...updatedPreferences];

            // Verify all cases have all 7 notification types set up before updating case step
            for (const [caseId, caseInfo] of processedCases) {
                if (caseInfo.actualCount !== caseInfo.expectedCount) {
                    throw new Error(`Failed to set up all notification preferences for case ${caseInfo.caseCode}. Expected ${caseInfo.expectedCount}, got ${caseInfo.actualCount}`);
                }
            }

            // Only update case step if ALL notification preferences are successfully set up for ALL cases
            for (const [caseId, caseInfo] of processedCases) {
                await manager.update('cases', { id: caseId }, { 
                    current_step: 'NOTIFICATIONS_CONFIGURED'
                });
            }

            const response = {
                message: `Successfully processed ${allPreferences.length} notification preferences (${createdPreferences.length} created, ${updatedPreferences.length} updated) for ${processedCases.size} case(s). All cases updated to NOTIFICATIONS_CONFIGURED.`,
                workflow_state: 'NOTIFICATIONS_CONFIGURED'
            };
            
            return response;
        });
    }

    async getNotificationPreferencesByCase(userId: number, caseId: string): Promise<NotificationPreferencesResponse> {
        // Validate case exists and user has access to it
        const targetCase = await this.caseRepository.findByCaseCode(caseId);
        if (!targetCase) {
            throw new Error(`Case with ID ${caseId} not found`);
        }

        // Ownership: case must belong to authenticated user
        if (targetCase.user_id !== userId) {
            throw new Error(`Unauthorized: You are not authorized to access case ${caseId}`);
        }

        const preferences = await this.notificationRepository.findByUserAndCase(userId, targetCase.id);

        return {
            message: `Found ${preferences.length} notification preferences for case ${caseId}`,
            workflow_state: targetCase.current_step 
        };
    }

    async getUserNotificationPreferences(userId: number): Promise<NotificationPreferencesResponse> {
        // Validate user exists
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const preferences = await this.notificationRepository.findByUserId(userId);

        return {
            message: `Found ${preferences.length} notification preferences for user`,
            workflow_state: 'USER_NOTIFICATIONS_RETRIEVED'
        };
    }

    private mapNotificationPreferenceToResponse(preference: any): any {
        return {
            notification_pref_id: preference.notification_pref_id,
            case_id: preference.case_id,
            user_id: preference.user_id,
            type: preference.type,
            delivery_method: preference.delivery_method,
            enabled: preference.enabled,
            alert_schedule: preference.alert_schedule,
            created_at: preference.created_at,
            updated_at: preference.updated_at
        };
    }
}