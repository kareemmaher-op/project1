export interface EmergencyContactRequestItem {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    send_invite?: boolean;
}

export interface EmergencyContactBulkRequest {
    contacts: EmergencyContactRequestItem[];
}

export type ValidationErrors = Record<string, string>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const e164PhoneRegex = /^\+?[1-9]\d{9,14}$/;

export async function validateEmergencyContactsPayload(payload: EmergencyContactBulkRequest): Promise<Record<number, ValidationErrors>> {
    const perItemErrors: Record<number, ValidationErrors> = {};

    if (!payload || !Array.isArray(payload.contacts) || payload.contacts.length === 0) {
        perItemErrors[-1] = { contacts: 'At least one contact is required' };
        return perItemErrors;
    }

    payload.contacts.forEach((item, index) => {
        const errors: ValidationErrors = {};
        if (!item.first_name || item.first_name.trim().length === 0) errors.first_name = 'First name is required';
        if (!item.last_name || item.last_name.trim().length === 0) errors.last_name = 'Last name is required';
        if (!item.email || item.email.trim().length === 0) errors.email = 'Email is required';
        else if (!emailRegex.test(item.email)) errors.email = 'Enter a valid email address';
        if (!item.phone_number || item.phone_number.trim().length === 0) errors.phone_number = 'Phone number is required';
        else if (!e164PhoneRegex.test(item.phone_number)) errors.phone_number = 'Enter a valid phone number (E.164)';
        // send_invite defaults handled upstream; no validation failure needed here
        if (Object.keys(errors).length > 0) perItemErrors[index] = errors;
    });

    return perItemErrors;
}