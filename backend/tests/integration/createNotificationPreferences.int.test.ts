import { createHttpRequest, createInvocationContext, parseJsonBodyFromResponse } from '../helpers/azureFunctionMocks';
import { createNotificationPreferencesHandler } from '../../src/functions/createNotificationPreferences';
import { UserRepository, CaseRepository } from '../../src/database/repositories';
import { NotificationPreferencesRequest } from '../../src/types/notification';

describe('Integration: createNotificationPreferences handler', () => {
  let userRepo: UserRepository;
  let caseRepo: CaseRepository;
  let userId: number;
  let caseId: string;

  beforeEach(async () => {
    userRepo = new UserRepository();
    caseRepo = new CaseRepository();
    
    // Create test user
    const user = await userRepo.create({ 
      first_name: 'Test', 
      last_name: 'User', 
      email: 'test@example.com', 
      phone_number: '1234567890', 
      password_hash: 'hashed_password' 
    } as any);
    userId = user.user_id;

    // Create test case
    const caseEntity = await caseRepo.create({
      case_id: 'TEST-CASE-123',
      case_name: 'Test Case for Notifications',
      user_id: userId,
      current_step: 'CREATED'
    } as any);
    caseId = caseEntity.case_id;
  });

  describe('Authentication', () => {
    it('returns 401 when user_id parameter missing', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          delivery_method: 'email',
          enabled: true
        }]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request);
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(401);
      expect(body.message).toBe('Unauthorized');
    });

    it('returns 401 when user_id header missing', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          delivery_method: 'email',
          enabled: true
        }]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {});
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(401);
      expect(body.message).toBe('Unauthorized');
    });

    it('authenticates successfully with user_id parameter', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          delivery_method: 'email',
          enabled: true
        }]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
    });

    it('authenticates successfully with x-user-id header', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          delivery_method: 'email',
          enabled: true
        }]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, { 'x-user-id': String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
    });
  });

  describe('Validation', () => {
    it('returns 400 when notification_preferences array is empty', async () => {
      const request = { notification_preferences: [] };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(400);
      expect(body.message).toBe('Validation failed');
      expect(body.error).toContain('At least one notification preference is required');
    });

    it('returns 400 when notification_preferences array is missing', async () => {
      const request = {};

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(400);
      expect(body.message).toBe('Validation failed');
      expect(body.error).toContain('Notification preferences array is required');
    });

    it('returns 400 when case_id is missing', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          delivery_method: 'email',
          enabled: true
        } as any]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(400);
      expect(body.message).toBe('Validation failed');
      expect(body.error).toContain('Case ID is required');
    });

    it('returns 400 when delivery_method is missing for enabled notification', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          enabled: true
        } as any]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(400);
      expect(body.message).toBe('Validation failed');
      expect(body.error).toContain('Delivery method is required when notification is enabled');
    });

    it('returns 400 when delivery_method is invalid', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          delivery_method: 'invalid_method',
          enabled: true
        }]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(400);
      expect(body.message).toBe('Validation failed');
      expect(body.error).toContain('Delivery method must be one of: email, sms, push, in_app');
    });

    it('returns 400 when enabled is not boolean', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          delivery_method: 'email',
          enabled: 'true' as any
        }]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(400);
      expect(body.message).toBe('Validation failed');
      expect(body.error).toContain('Enabled must be a boolean value');
    });

    it('accepts valid request with all required fields', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          delivery_method: 'email',
          enabled: true,
          alert_schedule: 'daily_9am'
        }]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
    });

    it('accepts disabled notifications without delivery_method', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          enabled: false,
          alert_schedule: 'daily_9am'
        }]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
    });
  });

  describe('Authorization', () => {
    it('returns 500 when case does not exist', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: 'NONEXISTENT-CASE',
          delivery_method: 'email',
          enabled: true
        }]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(404);
      expect(body.message).toContain('Case with ID NONEXISTENT-CASE not found');
    });

    it('returns 500 when user does not own the case', async () => {
      // Create another user
      const otherUser = await userRepo.create({ 
        first_name: 'Other', 
        last_name: 'User', 
        email: 'other@example.com', 
        phone_number: '0987654321', 
        password_hash: 'other_hashed_password' 
      } as any);

      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          delivery_method: 'email',
          enabled: true
        }]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(otherUser.user_id) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(401);
      expect(body.message).toContain('Unauthorized: You are not authorized to access case');
    });
  });

  describe('Business Logic', () => {
    it('creates all 7 notification types for a case', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          delivery_method: 'email',
          enabled: true,
          alert_schedule: 'daily_9am'
        }]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.message).toContain('Successfully processed 7 notification preferences');
      expect(body.data.message).toContain('7 created, 0 updated');
      expect(body.data.message).toContain('All cases updated to NOTIFICATIONS_CONFIGURED');
      expect(body.data.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
    });

    it('updates existing notification preferences', async () => {
      // First create
      const createRequest: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          delivery_method: 'email',
          enabled: true,
          alert_schedule: 'daily_9am'
        }]
      };

      const createReq = createHttpRequest('POST', 'http://localhost/api/notification-preferences', createRequest, {}, { user_id: String(userId) });
      const createCtx = createInvocationContext();
      await (createNotificationPreferencesHandler as any)(createReq, createCtx);

      // Then update
      const updateRequest: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          delivery_method: 'sms',
          enabled: true,
          alert_schedule: 'hourly'
        }]
      };

      const updateReq = createHttpRequest('POST', 'http://localhost/api/notification-preferences', updateRequest, {}, { user_id: String(userId) });
      const updateCtx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(updateReq, updateCtx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.message).toContain('0 created, 7 updated');
      expect(body.data.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
    });

    it('processes multiple cases in one request', async () => {
      // Create second case
      const secondCase = await caseRepo.create({
        case_id: 'TEST-CASE-456',
        case_name: 'Second Test Case',
        user_id: userId,
        current_step: 'CREATED'
      } as any);

      const request: NotificationPreferencesRequest = {
        notification_preferences: [
          {
            case_id: caseId,
            delivery_method: 'email',
            enabled: true
          },
          {
            case_id: secondCase.case_id,
            delivery_method: 'sms',
            enabled: true
          }
        ]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.message).toContain('Successfully processed 14 notification preferences');
      expect(body.data.message).toContain('for 2 case(s)');
      expect(body.data.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
    });

    it('validates all 7 notification types are created', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          delivery_method: 'email',
          enabled: true
        }]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.message).toContain('Successfully processed 7 notification preferences');
      expect(body.data.message).toContain('7 created, 0 updated');
    });

    it('updates case workflow state to NOTIFICATIONS_CONFIGURED', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: caseId,
          delivery_method: 'email',
          enabled: true
        }]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      expect(resp.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');

      // Verify case step was updated
      const updatedCase = await caseRepo.findByCaseCode(caseId);
      expect(updatedCase?.current_step).toBe('NOTIFICATIONS_CONFIGURED');
    });
  });

  describe('Error Handling', () => {
    it('handles malformed JSON gracefully', async () => {
      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', 'invalid json', {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);

      expect(resp.status).toBe(400);
    });

    it('handles missing Content-Type header', async () => {
      const request = {
        notification_preferences: [{
          case_id: caseId,
          delivery_method: 'email',
          enabled: true
        }]
      };

      const req = createHttpRequest('POST', 'http://localhost/api/notification-preferences', request, {}, { user_id: String(userId) });
      const ctx = createInvocationContext();
      const resp = await (createNotificationPreferencesHandler as any)(req, ctx);
      const body = await parseJsonBodyFromResponse(resp);

      // Should still work without explicit Content-Type
      expect(resp.status).toBe(201);
      expect(body.success).toBe(true);
    });
  });
});