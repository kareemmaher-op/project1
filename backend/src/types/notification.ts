// Notification Preference types
export interface NotificationPreferenceRequest {
    case_id: string;
    delivery_method?: string | null;
    // New: support multiple delivery methods while keeping backward compatibility
    delivery_methods?: string[];
    enabled: boolean;
    alert_schedule?: string;
}

export interface NotificationPreferencesRequest {
    notification_preferences: NotificationPreferenceRequest[];
}

export interface NotificationPreferenceResponse {
    notification_pref_id: number;
    case_id: number | null;
    user_id: number | null;
    type: string;
    delivery_method: string;
    enabled: boolean;
    alert_schedule: string | null;
    created_at?: Date;
    updated_at?: Date;
}

export interface NotificationPreferencesResponse {
    message: string;
    workflow_state: string;
}

export interface NotificationValidationErrors {
    case_id?: string;
    delivery_method?: string;
    delivery_methods?: string;
    enabled?: string;
    alert_schedule?: string;
    notification_preferences?: string;
}

// Define the 7 notification types as constants
export const NOTIFICATION_TYPES = [
    'medication_reminder',
    'appointment_reminder',
    'battery_low_alert',
    'connection_status_alert',
    'case_status_update',
    'emergency_alert',
    'system_maintenance'
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number];