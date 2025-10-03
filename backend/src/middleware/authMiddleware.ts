import { HttpRequest, InvocationContext } from '@azure/functions';
import { ResponseBuilder } from '../types/common';
import { UserService } from '../services/userService';
import { JwtValidator } from '../utils/jwtValidator';

export interface AuthenticatedRequest extends HttpRequest {
    authenticatedUser?: {
        user_id: number;
        email: string;
        first_name: string;
        last_name: string;
        entra_oid: string;
    };
}

export class AuthMiddleware {
    /**
     * Authentication middleware with JWT validation using Azure Entra ID JWKS
     * Supports both JWT token authentication and legacy mode for development
     */
    static async authenticate(request: HttpRequest, context: InvocationContext): Promise<AuthenticatedRequest | null> {
        try {
            const authHeader = request.headers.get('authorization');
            const legacyUserId = request.query.get('user_id') || request.headers.get('x-user-id');

            // Try JWT authentication first
            if (authHeader) {
                try {
                    // Validate JWT token with JWKS
                    const decodedToken = await JwtValidator.validateAuthHeader(authHeader);

                    context.log(`JWT validated for user OID: ${decodedToken.oid}`);

                    // Get user from database by Entra OID
                    const userService = new UserService();
                    const user = await userService.getUserByEntraOid(decodedToken.oid);

                    if (!user) {
                        context.log(`User with OID ${decodedToken.oid} not found in database`);
                        return null;
                    }

                    const authenticatedRequest = request as AuthenticatedRequest;
                    authenticatedRequest.authenticatedUser = {
                        user_id: user.user_id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        entra_oid: decodedToken.oid
                    };

                    context.log(`User ${decodedToken.oid} (ID: ${user.user_id}) authenticated successfully via JWT`);
                    return authenticatedRequest;

                } catch (jwtError) {
                    context.error(`JWT validation failed: ${jwtError instanceof Error ? jwtError.message : 'Unknown error'}`);
                    return null;
                }
            }

            // Fallback to legacy authentication for development (only if enabled)
            const allowLegacyAuth = process.env.ALLOW_LEGACY_AUTH === 'true';

            if (allowLegacyAuth && legacyUserId) {
                context.warn(`LEGACY AUTH USED - This should only be enabled in development! User ID: ${legacyUserId}`);

                const authenticatedRequest = request as AuthenticatedRequest;
                authenticatedRequest.authenticatedUser = {
                    user_id: parseInt(legacyUserId),
                    email: 'legacy@example.com',
                    first_name: 'Legacy',
                    last_name: 'User',
                    entra_oid: 'legacy-' + legacyUserId
                };

                return authenticatedRequest;
            }

            context.log('No valid authentication credentials provided');
            return null;

        } catch (error) {
            context.error('Authentication failed:', error);
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