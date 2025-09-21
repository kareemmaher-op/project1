import { app } from "@azure/functions";
import { ResponseBuilder } from "../types/common";
import { HttpHandler } from "../shared/httpHandler";
import { initializeDatabase } from "../database/config/database";
import { AuthMiddleware, AuthenticatedRequest } from "../middleware/authMiddleware";
import { UserService } from "../services/userService";

// GET /me/profile
export const getProfileHandler = HttpHandler.wrap(
    AuthMiddleware.withAuth(async (request, context) => {
        await initializeDatabase();
        const authReq = request as AuthenticatedRequest;
        const authenticatedUserId = authReq.authenticatedUser?.user_id;
        if (!authenticatedUserId) {
            return ResponseBuilder.unauthorized('Unauthorized');
        }
        const userService = new UserService();
        const profile = await userService.getProfile(authenticatedUserId);
        return ResponseBuilder.success(profile);
    }),
    { allowedMethods: ['GET'] }
);

app.http('getProfile', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'me/profile',
    handler: getProfileHandler
});

