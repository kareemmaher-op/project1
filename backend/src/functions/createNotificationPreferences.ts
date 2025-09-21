import { app } from "@azure/functions";
import { ResponseBuilder } from "../types/common";
import { NotificationPreferencesRequest } from "../types/notification";
import { NotificationPreferenceService } from "../services/notificationPreferenceService";
import { validateNotificationPreferencesData } from "../utils/validation/notification";
import { HttpHandler } from "../shared/httpHandler";
import { initializeDatabase } from "../database/config/database";
import { AuthMiddleware, AuthenticatedRequest } from "../middleware/authMiddleware";

// Exported handler for testing
export const createNotificationPreferencesHandler = HttpHandler.wrap(
    AuthMiddleware.withAuth(async (request, context) => {
        await initializeDatabase();

        const authReq = request as AuthenticatedRequest;
        const authenticatedUserId = authReq.authenticatedUser?.user_id;
        if (!authenticatedUserId) {
            return ResponseBuilder.unauthorized('Unauthorized');
        }

        const preferencesData = await HttpHandler.parseJsonBody<NotificationPreferencesRequest>(request);

        // Validate notification preferences data
        const validationErrors = await validateNotificationPreferencesData(preferencesData);
        if (Object.keys(validationErrors).length > 0) {
            return ResponseBuilder.badRequest('Validation failed', JSON.stringify(validationErrors));
        }

        // Create/Update notification preferences
        const notificationService = new NotificationPreferenceService();
        const response = await notificationService.createNotificationPreferences(preferencesData, authenticatedUserId);

        context.log(`Notification preferences processed successfully. Case step updated to: ${response.workflow_state}`);
        return ResponseBuilder.created(response, `Notification preferences saved successfully. Case step updated to: ${response.workflow_state}`);
    }),
    { allowedMethods: ['POST'] }
);

// Create Notification Preferences Function
app.http('createNotificationPreferences', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'notification-preferences',
    handler: createNotificationPreferencesHandler
});