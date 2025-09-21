import { HttpRequest, InvocationContext } from '@azure/functions';
import { ResponseBuilder } from '../types/common';

export interface HttpHandlerOptions {
    requireAuth?: boolean;
    allowedMethods?: string[];
}

export class HttpHandler {
    /**
     * Wraps Azure Functions with standardized error handling and middleware
     */
    static wrap(
        handler: (request: HttpRequest, context: InvocationContext) => Promise<any>,
        options: HttpHandlerOptions = {}
    ) {
        return async (request: HttpRequest, context: InvocationContext) => {
            try {
                // Log request
                context.log(`${request.method} ${request.url} - Function started`);

                // Handle CORS preflight
                if (request.method === 'OPTIONS') {
                    return {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Credentials': 'false',
                            'Access-Control-Allow-Headers': 'Content-Type, x-user-id, Authorization',
                            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                        },
                        body: ''
                    } as any;
                }

                // Check allowed methods
                if (options.allowedMethods && !options.allowedMethods.includes(request.method)) {
                    return ResponseBuilder.methodNotAllowed(`Method ${request.method} not allowed`);
                }

                // Execute handler
                const result = await handler(request, context);

                // Log success
                context.log(`${request.method} ${request.url} - Function completed successfully`);

                return result;

            } catch (error) {
                // Log error
                context.log(`${request.method} ${request.url} - Function failed:`, error);

                // Map common error messages to HTTP responses
                if (error instanceof Error) {
                    // Prioritize auth errors over generic not-found text
                    if (error.message.toLowerCase().startsWith('unauthorized')) {
                        return ResponseBuilder.unauthorized(error.message);
                    }
                    if (error.message.toLowerCase().includes('not found')) {
                        return ResponseBuilder.notFound(error.message);
                    }
                    if (error.message.toLowerCase().startsWith('conflict') || error.message.toLowerCase().includes('already exists')) {
                        return ResponseBuilder.conflict(error.message.replace(/^conflict:\s*/i, ''));
                    }
                    if (error.message.includes('Validation failed') || error.message.toLowerCase().startsWith('invalid request') || error.message.toLowerCase().includes('invalid json')) {
                        return ResponseBuilder.badRequest(error.message);
                    }
                    if (error.message.toLowerCase().startsWith('internal error')) {
                        return ResponseBuilder.internalServerError(error.message.replace(/^internal error:\s*/i, ''));
                    }
                }

                return ResponseBuilder.internalServerError('An unexpected error occurred');
            }
        };
    }

    /**
     * Parses JSON request body with error handling
     */
    static async parseJsonBody<T>(request: HttpRequest): Promise<T> {
        try {
            const body = await request.text();
            if (!body) {
                throw new Error('Request body is empty');
            }
            return JSON.parse(body) as T;
        } catch (error) {
            throw new Error('Invalid JSON in request body');
        }
    }

    /**
     * Extracts user ID from request (query param or authenticated user)
     */
    static getUserId(request: HttpRequest): number | null {
        const userId = request.query.get('user_id');
        return userId ? parseInt(userId) : null;
    }

    /**
     * Validates required fields in request body
     */
    static validateRequiredFields(body: any, requiredFields: string[]): string[] {
        const missingFields: string[] = [];
        
        for (const field of requiredFields) {
            if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
                missingFields.push(field);
            }
        }
        
        return missingFields;
    }
}