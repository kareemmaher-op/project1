// Patient-specific types
export interface PatientRegistrationRequest {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    allergies_medical_history?: string;
    is_self?: boolean;
    invite_email?: string;
    location: string;
    postal_code: string;
    case_id: string; // Link to existing case
}

export interface PatientResponse {
    patient_id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    date_of_birth: Date;
    allergies_medical_history: string | null;
    is_self: boolean;
    invite_email: string | null;
    location: string;
    postal_code: string;
    created_at: Date;
    updated_at: Date;
    workflow_state?: string;
    // Optional richer fields below are not produced by createPatient currently
}

// The following listing/update/query types are not used in current flows and were
// intentionally removed to keep create-patient types focused. Reintroduce when needed.

export interface PatientValidationErrors {
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    invite_email?: string;
    location?: string;
    postal_code?: string;
    allergies_medical_history?: string;
}