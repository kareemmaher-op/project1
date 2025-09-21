import { MedicationRegistrationRequest, MedicationValidationErrors } from '../../types/medication';

export async function validateMedicationData(data: MedicationRegistrationRequest): Promise<MedicationValidationErrors> {
    const errors: MedicationValidationErrors = {};

    if (!data.case_id) {
        errors.case_id = 'Case ID is required';
    }

    if (!data.spray_number) {
        errors.spray_number = 'Spray number is required';
    } else if (![1, 2].includes(data.spray_number)) {
        errors.spray_number = 'Spray number must be 1 or 2';
    }

    if (!data.expiration_date_spray_1) {
        errors.expiration_date_spray_1 = 'Expiration date for spray 1 is required';
    } else if (isNaN(new Date(data.expiration_date_spray_1).getTime())) {
        errors.expiration_date_spray_1 = 'Invalid date format';
    }

    if (!data.expiration_date_spray_2) {
        errors.expiration_date_spray_2 = 'Expiration date for spray 2 is required';
    } else if (isNaN(new Date(data.expiration_date_spray_2).getTime())) {
        errors.expiration_date_spray_2 = 'Invalid date format';
    }

    return errors;
}

