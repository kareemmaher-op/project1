import { app } from "@azure/functions";
import { ResponseBuilder } from "../types/common";
import { HttpHandler } from "../shared/httpHandler";
import { initializeDatabase } from "../database/config/database";
import { AuthMiddleware, AuthenticatedRequest } from "../middleware/authMiddleware";
import { InvitedUserService } from "../services/invitedUserService";
import { validateInviteMemberPayload, InviteMemberRequest } from "../utils/validation/invitedUser";

export const inviteMemberHandler = HttpHandler.wrap(
	AuthMiddleware.withAuth(async (request, context) => {
		await initializeDatabase();

		const authReq = request as AuthenticatedRequest;
		const authenticatedUserId = authReq.authenticatedUser?.user_id;
		if (!authenticatedUserId) {
			return ResponseBuilder.unauthorized('Unauthorized');
		}

        const payload = await HttpHandler.parseJsonBody<InviteMemberRequest & { case_id?: string }>(request);
        if (!payload.case_id || typeof payload.case_id !== 'string' || payload.case_id.trim().length === 0) {
            return ResponseBuilder.badRequest('Validation failed', JSON.stringify({ case_id: 'case_id is required in body' }));
        }
		const validationErrors = await validateInviteMemberPayload(payload);
		if (Object.keys(validationErrors).length > 0) {
			return ResponseBuilder.badRequest('Validation failed', JSON.stringify(validationErrors));
		}

        const service = new InvitedUserService();
        if (payload.emails && Array.isArray(payload.emails) && payload.emails.length > 0) {
            const result = await service.inviteUsersToCaseByCaseCode(payload.case_id, payload.emails, authenticatedUserId);
			return ResponseBuilder.created({ success: true, ...result }, 'Invitations processed');
		}

        const invite = await service.inviteUserToCaseByCaseCode(payload.case_id, payload.email as string, authenticatedUserId);
		return ResponseBuilder.created({ success: true, invite }, 'Invitation sent successfully');
	}),
	{ allowedMethods: ['POST'] }
);

app.http('inviteMember', {
	methods: ['POST'],
	authLevel: 'anonymous',
	route: 'invite-member',
	handler: inviteMemberHandler
});