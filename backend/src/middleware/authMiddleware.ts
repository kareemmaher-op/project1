import { HttpRequest, InvocationContext } from '@azure/functions';
import { ResponseBuilder } from '../types/common';

export interface AuthenticatedRequest extends HttpRequest {
    authenticatedUser?: {
        user_id: number;
        email: string;
        first_name: string;
        last_name: string;
    };
}

export class AuthMiddleware {
    /**
     * Simple authentication middleware that currently always returns true
     * TODO: Implement JWT validation with Azure Entra ID using JWKS
     */
    static async authenticate(request: HttpRequest, context: InvocationContext): Promise<AuthenticatedRequest | null> {
        try {
            // For now, we'll extract user_id from query parameters or headers
            // In production, this should validate JWT tokens from Azure Entra ID
            
            const userId = request.query.get('user_id') || request.headers.get('x-user-id');
            
            if (!userId) {
                context.log('No user ID provided in request');
                return null;
            }

            // TODO: Validate JWT token here
            // 1. Extract token from Authorization header
            // 2. Verify token signature using Azure Entra ID JWKS
            // 3. Extract user information from token claims
            // 4. Return authenticated user object

            // For now, return a mock user object
            const authenticatedRequest = request as AuthenticatedRequest;
            authenticatedRequest.authenticatedUser = {
                user_id: parseInt(userId),
                email: 'user@example.com', // This should come from JWT claims
                first_name: 'User',
                last_name: 'Name'
            };

            context.log(`User ${userId} authenticated successfully`);
            return authenticatedRequest;

        } catch (error) {
            context.log('Authentication failed:', error);
            return null;
        }
    }

    /**
     * Middleware wrapper for Azure Functions that applies authentication
     */
    static withAuth(handler: (request: AuthenticatedRequest, context: InvocationContext) => Promise<any>) {
        return async (request: HttpRequest, context: InvocationContext) => {
            const authenticatedRequest = await AuthMiddleware.authenticate(request, context);
            
            if (!authenticatedRequest) {
                return ResponseBuilder.unauthorized('Unauthorized');
            }

            return handler(authenticatedRequest, context);
        };
    }
}