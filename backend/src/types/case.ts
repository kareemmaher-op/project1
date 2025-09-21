// Case-specific types
export interface CaseRegistrationRequest {
    case_id: string;
    case_name: string;
    connection_status?: string;
    battery_level?: number;
}

export interface CaseResponse {
    case_id: string;
    patient_id: number | null;
    case_name: string;
    battery_level: number | null;
    last_seen: Date | null;
    connection_status: string | null;
    workflow_state?: string;
    patient?: {
        patient_id: number;
        first_name: string;
        last_name: string;
        user_id: number;
    };
}

export interface MedicationSummary {
    spray_id: number;
    spray_number: number;
    status: string;
    expiration_date: Date;
    dosage_details: string | null;
}

export interface CaseUpdateRequest {
    case_name?: string;
    battery_level?: number;
    connection_status?: string;
}

export interface CaseQueryParams {
    page?: number;
    limit?: number;
    patient_id?: number;
    user_id?: number;
    connection_status?: string;
    search?: string;
}

export interface CaseListResponse {
    cases: CaseResponse[];
    totalCount: number;
    page: number;
    limit: number;
}

export interface CaseValidationErrors {
    case_id?: string;
    case_name?: string;
    connection_status?: string;
    battery_level?: string;
}

export enum ConnectionStatus {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    SYNCING = 'syncing',
    ERROR = 'error'
}

export interface DeviceStatusUpdate {
    case_id: string;
    connection_status: ConnectionStatus;
    battery_level?: number;
    last_seen?: Date;
}