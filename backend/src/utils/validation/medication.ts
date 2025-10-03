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

    // LOT number validation (optional fields)
    if (data.lot_number_spray_1 && data.lot_number_spray_1.length > 50) {
        errors.lot_number_spray_1 = 'LOT number for spray 1 cannot exceed 50 characters';
    }

    if (data.lot_number_spray_2 && data.lot_number_spray_2.length > 50) {
        errors.lot_number_spray_2 = 'LOT number for spray 2 cannot exceed 50 characters';
    }

    return errors;
}

