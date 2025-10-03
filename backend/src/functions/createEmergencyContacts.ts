import { app } from "@azure/functions";
import { ResponseBuilder } from "../types/common";
import { HttpHandler } from "../shared/httpHandler";
import { initializeDatabase } from "../database/config/database";
import { AuthMiddleware, AuthenticatedRequest } from "../middleware/authMiddleware";
import { EmergencyContactService } from "../services/emergencyContactService";
import { validateEmergencyContactsPayload, EmergencyContactBulkRequest } from "../utils/validation/emergencyContact";

export const createEmergencyContactsHandler = HttpHandler.wrap(
    AuthMiddleware.withAuth(async (request, _context) => {
        await initializeDatabase();

        const authReq = request as AuthenticatedRequest;
        const authenticatedUserId = authReq.authenticatedUser?.user_id;
        if (!authenticatedUserId) {
            return ResponseBuilder.unauthorized('Unauthorized');
        }

        const payload = await HttpHandler.parseJsonBody<EmergencyContactBulkRequest & { case_id?: string }>(request);
        if (!payload.case_id || typeof payload.case_id !== 'string' || payload.case_id.trim().length === 0) {
            return ResponseBuilder.badRequest('Validation failed', JSON.stringify({ case_id: 'case_id is required in body' }));
        }
        const validationErrors = await validateEmergencyContactsPayload(payload);
        if (Object.keys(validationErrors).length > 0) {
            return ResponseBuilder.badRequest('Validation failed', JSON.stringify(validationErrors));
        }

        const service = new EmergencyContactService();
        const { saved, skipped, workflow_state, message } = await service.createEmergencyContacts({
            caseCode: payload.case_id,
            contacts: payload.contacts.map(c => ({
                first_name: c.first_name,
                last_name: c.last_name,
                email: c.email,
                phone_number: c.phone_number,
                send_invite: !!c.send_invite,
            })),
            createdByUserId: authenticatedUserId
        });

        return ResponseBuilder.created({
            success: true,
            created: saved.length,
            skipped,
            contacts: saved,
            workflow_state
        }, message || 'Emergency contacts saved successfully');
    }),
    { allowedMethods: ['POST'] }
);

app.http('createEmergencyContacts', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'add-emergency-contacts',
    handler: createEmergencyContactsHandler
});