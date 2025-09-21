import { CaseRegistrationRequest, CaseValidationErrors } from '../../types/case';

export async function validateCaseData(data: CaseRegistrationRequest): Promise<CaseValidationErrors> {
    const errors: CaseValidationErrors = {};

    if (!data.case_id || data.case_id.trim().length === 0) {
        errors.case_id = 'Case ID is required';
    }

    if (!data.case_name) {
        errors.case_name = 'Case name is required';
    } else if (data.case_name.trim().length < 2) {
        errors.case_name = 'Case name must be at least 2 characters';
    }

    return errors;
}

