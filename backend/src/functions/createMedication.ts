import { app } from "@azure/functions";
import { ResponseBuilder } from "../types/common";
import { MedicationRegistrationRequest } from "../types/medication";
import { MedicationService } from "../services/medicationService";
import { validateMedicationData } from "../utils/validation/medication";
import { HttpHandler } from "../shared/httpHandler";
import { initializeDatabase } from "../database/config/database";
import { AuthMiddleware, AuthenticatedRequest } from "../middleware/authMiddleware";

// HTTP handler wrapper
export const createMedicationHandler = HttpHandler.wrap(
    AuthMiddleware.withAuth(async (request, context) => {
        await initializeDatabase();

        const authReq = request as AuthenticatedRequest;
        const authenticatedUserId = authReq.authenticatedUser?.user_id;
        if (!authenticatedUserId) {
            return ResponseBuilder.unauthorized('Unauthorized');
        }

        const medicationData = await HttpHandler.parseJsonBody<MedicationRegistrationRequest>(request);
        
        // Validate request body
        const validationErrors = await validateMedicationData(medicationData);
        if (Object.keys(validationErrors).length > 0) {
            return ResponseBuilder.badRequest('Validation failed', JSON.stringify(validationErrors));
        }

        // Upsert medication and advance workflow
        const medicationService = new MedicationService();
        const response = await medicationService.createMedication(medicationData, authenticatedUserId);

        context.log(`Medication upserted successfully: ${response.spray_id}`);
        return ResponseBuilder.created(response, 'Medication saved successfully');
    }),
    { allowedMethods: ['POST'] }
);

// Azure Function registration
app.http('createMedication', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'medications',
    handler: createMedicationHandler
});