import { app } from "@azure/functions";
import { ResponseBuilder } from "../types/common";
import { CaseService } from "../services/caseService";
import { AuthMiddleware, AuthenticatedRequest } from "../middleware/authMiddleware";
import { HttpHandler } from "../shared/httpHandler";
import { initializeDatabase } from "../database/config/database";

// HTTP handler wrapper
export const getUserCasesHandler = HttpHandler.wrap(
    AuthMiddleware.withAuth(async (request, context) => {
        await initializeDatabase();

        const authReq = request as AuthenticatedRequest;
        const authenticatedUserId = authReq.authenticatedUser?.user_id;
        if (!authenticatedUserId) {
            return ResponseBuilder.unauthorized('Unauthorized');
        }

        console.log(`GET http://localhost:7071/api/cases/user - Function started`);
        const userOid = request.headers.get('x-user-oid');
        console.log(`User ${userOid} (ID: ${authenticatedUserId}) authenticated successfully`);

        try {
            // Get user cases
            const caseService = new CaseService();
            const userCases = await caseService.getUserCases(authenticatedUserId);

            console.log(`Found ${userCases.length} cases for user ${authenticatedUserId}`);
            console.log(`GET http://localhost:7071/api/cases/user - Function completed successfully`);

            return ResponseBuilder.success({
                data: userCases,
                message: 'User cases retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting user cases:', error);
            return ResponseBuilder.internalServerError('Failed to get user cases');
        }
    })
);

// Register the function
app.http('getUserCases', {
    methods: ['GET'],
    route: 'cases/user',
    authLevel: 'anonymous',
    handler: getUserCasesHandler,
});