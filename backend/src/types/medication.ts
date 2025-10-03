// Medication-specific types
export interface MedicationRegistrationRequest {
    case_id: string;
    spray_number: number;
    expiration_date_spray_1: string;
    lot_number_spray_1?: string;
    expiration_date_spray_2: string;
    lot_number_spray_2?: string;
    dosage_details?: string;
}

export interface MedicationResponse {
    spray_id: number;
    case_id: number;
    spray_number: number;
    status: string;
    expiration_date_spray_1: Date;
    lot_number_spray_1: string | null;
    expiration_date_spray_2: Date;
    lot_number_spray_2: string | null;
    dosage_details: string | null;
    created_at: Date;
    updated_at: Date;
    workflow_state?: string;
}

export interface MedicationValidationErrors {
    case_id?: string;
    spray_number?: string;
    expiration_date_spray_1?: string;
    lot_number_spray_1?: string;
    expiration_date_spray_2?: string;
    lot_number_spray_2?: string;
    dosage_details?: string;
}