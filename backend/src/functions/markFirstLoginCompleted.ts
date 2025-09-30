import { app } from "@azure/functions";
import { ResponseBuilder } from "../types/common";
import { HttpHandler } from "../shared/httpHandler";
import { initializeDatabase } from "../database/config/database";
import { AuthMiddleware, AuthenticatedRequest } from "../middleware/authMiddleware";
import { UserService } from "../services/userService";

// PATCH /auth/users/{oid}/first-login-completed
export const markFirstLoginCompletedHandler = HttpHandler.wrap(
    AuthMiddleware.withAuth(async (request, context) => {
        await initializeDatabase();

        const authReq = request as AuthenticatedRequest;
        const userOid = request.params.oid;

        if (!userOid) {
            return ResponseBuilder.badRequest('User OID is required');
        }

        // Ensure the authenticated user is the same as the one being updated
        const authenticatedUser = authReq.authenticatedUser;
        if (!authenticatedUser) {
            return ResponseBuilder.unauthorized('Unauthorized');
        }

        try {
            const userService = new UserService();
            const user = await userService.getUserByEntraOid(userOid);

            if (!user) {
                return ResponseBuilder.notFound('User not found');
            }

            // Only allow users to update their own first login status
            if (user.user_id !== authenticatedUser.user_id) {
                return ResponseBuilder.forbidden('Cannot update another user\'s first login status');
            }

            const updatedUser = await userService.markFirstLoginCompleted(userOid);

            context.log(`First login completed marked for user: ${userOid}`);
            return ResponseBuilder.success(updatedUser, 'First login completed successfully');
        } catch (error) {
            context.log(`Error marking first login completed: ${error}`);
            return ResponseBuilder.internalServerError('Failed to mark first login completed');
        }
    }),
    { allowedMethods: ['PATCH'] }
);

app.http('markFirstLoginCompleted', {
    methods: ['PATCH'],
    authLevel: 'anonymous',
    route: 'auth/users/{oid}/first-login-completed',
    handler: markFirstLoginCompletedHandler
});