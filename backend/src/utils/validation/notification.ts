import { NotificationPreferencesRequest, NotificationValidationErrors } from '../../types/notification';

export async function validateNotificationPreferencesData(data: NotificationPreferencesRequest): Promise<NotificationValidationErrors> {
    const errors: NotificationValidationErrors = {};

    // Validate that notification_preferences array exists and is not empty
    if (!data.notification_preferences || !Array.isArray(data.notification_preferences)) {
        errors.notification_preferences = 'Notification preferences array is required';
        return errors;
    }

    if (data.notification_preferences.length === 0) {
        errors.notification_preferences = 'At least one notification preference is required';
        return errors;
    }

    if (data.notification_preferences.length > 7) {
        errors.notification_preferences = 'Maximum 7 notification preferences allowed';
        return errors;
    }

    // Validate each notification preference
    data.notification_preferences.forEach((pref, index) => {
        const prefix: string = `notification_preferences[${index}]`;

        if (!pref.case_id || pref.case_id.trim().length === 0) {
            errors[prefix + '.case_id'] = 'Case ID is required';
        }

        // Delivery methods validation (supports both legacy single string and new array)
        const allowed: string[] = ['email', 'sms', 'push', 'in_app'];
        if (pref.enabled) {
            const prefWithMethods = pref as any;
            const hasArray: boolean = Array.isArray(prefWithMethods.delivery_methods);
            const hasSingle: boolean = typeof pref.delivery_method === 'string' && pref.delivery_method.trim().length > 0;

            if (!hasArray && !hasSingle) {
                errors[prefix + '.delivery_methods'] = 'At least one delivery method is required when notification is enabled';
            }

            if (hasArray) {
                const methods: string[] = prefWithMethods.delivery_methods as string[];
                if (methods.length === 0) {
                    errors[prefix + '.delivery_methods'] = 'At least one delivery method is required when notification is enabled';
                } else if (methods.some((m: string) => typeof m !== 'string' || !allowed.includes(m))) {
                    errors[prefix + '.delivery_methods'] = 'Each delivery method must be one of: email, sms, push, in_app';
                }
            } else if (hasSingle) {
                if (!allowed.includes(pref.delivery_method as string)) {
                    errors[prefix + '.delivery_method'] = 'Delivery method must be one of: email, sms, push, in_app';
                }
            }
        }
        // If disabled, delivery_method(s) can be null/empty (optional)

        if (typeof pref.enabled !== 'boolean') {
            errors[prefix + '.enabled'] = 'Enabled must be a boolean value';
        }
    });

    return errors;
}