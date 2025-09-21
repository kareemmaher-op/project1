import { HttpResponseInit } from "@azure/functions";

// Common response interfaces
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// Standard HTTP responses
export class ResponseBuilder {
    private static corsHeaders() {
        const origin = process.env.CORS_ORIGIN || 'http://localhost:3000';
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Headers': 'Content-Type, x-user-id, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        } as Record<string, string>;
    }
    static success<T>(data?: T, message?: string): HttpResponseInit {
        const response: ApiResponse<T> = {
            success: true,
            data,
            message
        };
        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                ...this.corsHeaders(),
            },
            body: JSON.stringify(response)
        };
    }

    static created<T>(data?: T, message?: string): HttpResponseInit {
        const response: ApiResponse<T> = {
            success: true,
            data,
            message
        };
        return {
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                ...this.corsHeaders(),
            },
            body: JSON.stringify(response)
        };
    }

    static badRequest(message: string, error?: string): HttpResponseInit {
        const response: ApiResponse = {
            success: false,
            message,
            error
        };
        return {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
                ...this.corsHeaders(),
            },
            body: JSON.stringify(response)
        };
    }

    static unauthorized(message: string = 'Unauthorized'): HttpResponseInit {
        const response: ApiResponse = {
            success: false,
            message
        };
        return {
            status: 401,
            headers: {
                'Content-Type': 'application/json',
                ...this.corsHeaders(),
            },
            body: JSON.stringify(response)
        };
    }

    static notFound(message: string = 'Resource not found'): HttpResponseInit {
        const response: ApiResponse = {
            success: false,
            message
        };
        return {
            status: 404,
            headers: {
                'Content-Type': 'application/json',
                ...this.corsHeaders(),
            },
            body: JSON.stringify(response)
        };
    }

    static forbidden(message: string = 'Forbidden'): HttpResponseInit {
        const response: ApiResponse = {
            success: false,
            message
        };
        return {
            status: 403,
            headers: {
                'Content-Type': 'application/json',
                ...this.corsHeaders(),
            },
            body: JSON.stringify(response)
        };
    }

    static conflict(message: string = 'Conflict'): HttpResponseInit {
        const response: ApiResponse = {
            success: false,
            message
        };
        return {
            status: 409,
            headers: {
                'Content-Type': 'application/json',
                ...this.corsHeaders(),
            },
            body: JSON.stringify(response)
        };
    }

    static methodNotAllowed(message: string = 'Method not allowed'): HttpResponseInit {
        const response: ApiResponse = {
            success: false,
            message
        };
        return {
            status: 405,
            headers: {
                'Content-Type': 'application/json',
                ...this.corsHeaders(),
            },
            body: JSON.stringify(response)
        };
    }

    static internalError(message: string = 'Internal server error', error?: string): HttpResponseInit {
        const response: ApiResponse = {
            success: false,
            message,
            error
        };
        return {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...this.corsHeaders(),
            },
            body: JSON.stringify(response)
        };
    }

    // Alias to satisfy existing references
    static internalServerError(message: string = 'Internal server error', error?: string): HttpResponseInit {
        return this.internalError(message, error);
    }
}

// Common validation utilities
export class ValidationHelper {
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static isValidPassword(password: string): boolean {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    static sanitizeInput(input: string): string {
        return input.trim().replace(/[<>]/g, '');
    }
}