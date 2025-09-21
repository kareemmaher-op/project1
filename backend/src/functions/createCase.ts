import { app } from "@azure/functions";
import { ResponseBuilder } from "../types/common";
import { CaseService } from "../services/caseService";
import { validateCaseData } from "../utils/validation/case";
import { AuthMiddleware, AuthenticatedRequest } from "../middleware/authMiddleware";
import { CaseRegistrationRequest } from "../types/case";
import { HttpHandler } from "../shared/httpHandler";
import { initializeDatabase } from "../database/config/database";

// HTTP handler wrapper
export const createCaseHandler = HttpHandler.wrap(
    AuthMiddleware.withAuth(async (request, context) => {
        await initializeDatabase();

        const authReq = request as AuthenticatedRequest;
        const authenticatedUserId = authReq.authenticatedUser?.user_id;
        if (!authenticatedUserId) {
            return ResponseBuilder.unauthorized('Unauthorized');
        }

        const caseData = await HttpHandler.parseJsonBody<CaseRegistrationRequest>(request);

        // Validate request body
        const validationErrors = await validateCaseData(caseData);
        if (Object.keys(validationErrors).length > 0) {
            return ResponseBuilder.badRequest('Validation failed', JSON.stringify(validationErrors));
        }

        // Create or update case
        const caseService = new CaseService();
        const response = await caseService.createCase(caseData, authenticatedUserId);

        context.log(`Case created successfully: ${response.case_id}`);
        return ResponseBuilder.created(response, 'Case created successfully');
    }),
    { allowedMethods: ['POST'] }
);

// Azure Function registration
app.http('createCase', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'cases',
    handler: createCaseHandler
});