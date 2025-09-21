// Registration-specific types
export interface UserRegistrationRequest {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    date_of_birth?: string;
}

export interface UserRegistrationResponse {
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    message: string;
}

export interface RegistrationValidationErrors {
    email?: string;
    password?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
}