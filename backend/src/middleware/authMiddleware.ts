import { HttpRequest, InvocationContext } from '@azure/functions';
import { ResponseBuilder } from '../types/common';
import { UserService } from '../services/userService';

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
     * Authentication middleware that gets user by Entra OID
     * TODO: Implement JWT validation with Azure Entra ID using JWKS
     */
    static async authenticate(request: HttpRequest, context: InvocationContext): Promise<AuthenticatedRequest | null> {
        try {
            // Look for user OID in headers (from Entra ID token)
            const userOid = request.headers.get('x-user-oid');

            // Fallback to legacy user_id for backward compatibility
            const legacyUserId = request.query.get('user_id') || request.headers.get('x-user-id');

            if (!userOid && !legacyUserId) {
                context.log('No user OID or legacy user ID provided in request');
                return null;
            }

            // TODO: Implement full JWT validation with Azure Entra ID JWKS
            // For now, we'll check if the Authorization header is present for better security
            const authHeader = request.headers.get('authorization');
            if (userOid && !authHeader) {
                context.log('User OID provided but no authorization token');
                return null;
            }

            const authenticatedRequest = request as AuthenticatedRequest;

            if (userOid) {
                // Get user by Entra OID from database
                const userService = new UserService();
                const user = await userService.getUserByEntraOid(userOid);

                if (!user) {
                    context.log(`User with OID ${userOid} not found`);
                    return null;
                }

                authenticatedRequest.authenticatedUser = {
                    user_id: user.user_id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name
                };

                context.log(`User ${userOid} (ID: ${user.user_id}) authenticated successfully`);
                return authenticatedRequest;
            } else if (legacyUserId) {
                // Legacy fallback for development
                authenticatedRequest.authenticatedUser = {
                    user_id: parseInt(legacyUserId),
                    email: 'user@example.com',
                    first_name: 'User',
                    last_name: 'Name'
                };

                context.log(`Legacy user ${legacyUserId} authenticated`);
                return authenticatedRequest;
            }

            return null;

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