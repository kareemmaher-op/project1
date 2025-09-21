import { PatientRegistrationRequest, PatientValidationErrors } from '../../types/patient';

export async function validatePatientData(data: PatientRegistrationRequest): Promise<PatientValidationErrors> {
    const errors: PatientValidationErrors = {};

    if (!data.first_name) {
        errors.first_name = 'First name is required';
    } else if (data.first_name.trim().length < 2) {
        errors.first_name = 'First name must be at least 2 characters';
    }

    if (!data.last_name) {
        errors.last_name = 'Last name is required';
    } else if (data.last_name.trim().length < 2) {
        errors.last_name = 'Last name must be at least 2 characters';
    }

    if (!data.date_of_birth) {
        errors.date_of_birth = 'Date of birth is required';
    } else if (isNaN(new Date(data.date_of_birth).getTime())) {
        errors.date_of_birth = 'Invalid date format';
    }

    if (!data.location) {
        errors.location = 'Location is required';
    }

    if (!data.postal_code) {
        errors.postal_code = 'Postal code is required';
    }

    if (data.invite_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.invite_email)) {
        errors.invite_email = 'Invalid email format';
    }

    return errors;
}

