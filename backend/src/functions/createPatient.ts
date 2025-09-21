import { app } from "@azure/functions";
import { ResponseBuilder } from "../types/common";
import { PatientRegistrationRequest } from "../types/patient";
import { PatientService } from "../services/patientService";
import { validatePatientData } from "../utils/validation/patient";
import { HttpHandler } from "../shared/httpHandler";
import { initializeDatabase } from "../database/config/database";
import { AuthMiddleware, AuthenticatedRequest } from "../middleware/authMiddleware";

// HTTP handler wrapper
export const createPatientHandler = HttpHandler.wrap(
    AuthMiddleware.withAuth(async (request, context) => {
        await initializeDatabase();

        const authReq = request as AuthenticatedRequest;
        const authenticatedUserId = authReq.authenticatedUser?.user_id;
        if (!authenticatedUserId) {
            return ResponseBuilder.unauthorized('Unauthorized');
        }

        const patientData = await HttpHandler.parseJsonBody<PatientRegistrationRequest>(request);

        // Validate request body
        const validationErrors = await validatePatientData(patientData);
        if (Object.keys(validationErrors).length > 0) {
            return ResponseBuilder.badRequest('Validation failed', JSON.stringify(validationErrors));
        }

        // Create or update patient and link to case
        const patientService = new PatientService();
        const response = await patientService.createPatient(patientData, authenticatedUserId);

        context.log(`Patient created successfully: ${response.patient_id}`);
        return ResponseBuilder.created(response, 'Patient created successfully');
    }),
    { allowedMethods: ['POST'] }
);

// Azure Function registration
app.http('createPatient', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'patients',
    handler: createPatientHandler
});