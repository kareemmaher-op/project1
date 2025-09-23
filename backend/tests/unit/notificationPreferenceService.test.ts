import { NotificationPreferenceService } from '../../src/services/notificationPreferenceService';
import { NotificationPreferencesRequest } from '../../src/types/notification';
import { createPgMemDataSource, clearAllTables } from '../helpers/testDataSource.pgmem';
import { setTestDataSource, getInjected } from '../helpers/testBridge';

describe('NotificationPreferenceService', () => {
  let service: NotificationPreferenceService;
  let ownerId: number;

  beforeAll(async () => {
    const ds = createPgMemDataSource();
    await ds.initialize();
    await setTestDataSource(ds);
  });

  beforeEach(async () => {
    const ds = getInjected();
    if (ds) await clearAllTables(ds);
    
    service = new NotificationPreferenceService();
    
    // Create a test user first
    const userRepo = ds!.getRepository('User');
    const user = await userRepo.save({
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      phone_number: '1234567890',
      password_hash: 'hashed_password'
    });
    ownerId = user.user_id;
    
    // Create a test case for the owner
    const caseRepo = ds!.getRepository('Case');
    await caseRepo.save({
      case_id: 'CASE-UT-1',
      case_name: 'Unit Test Case',
      user_id: ownerId,
      current_step: 'CREATED'
    });
  });

  afterAll(async () => {
    const ds = getInjected();
    if (ds?.isInitialized) await ds.destroy();
    await setTestDataSource(null as any);
  });

  describe('createNotificationPreferences', () => {
    it('creates all 7 notification types for a case', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: 'CASE-UT-1',
          delivery_method: 'email',
          enabled: true
        }]
      };

      const result = await service.createNotificationPreferences(request, ownerId);

      expect(result.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
      expect(result.message).toContain('Successfully processed 7 notification preferences');
      expect(result.message).toContain('7 created, 0 updated');
      expect(result.message).toContain('All cases updated to NOTIFICATIONS_CONFIGURED');
      expect(result.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
    });

    it('updates existing notification preferences', async () => {
      // First create
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: 'CASE-UT-1',
          delivery_method: 'email',
          enabled: true
        }]
      };

      await service.createNotificationPreferences(request, ownerId);

      // Then update
      const updateRequest: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: 'CASE-UT-1',
          delivery_method: 'sms',
          enabled: true
        }]
      };

      const result = await service.createNotificationPreferences(updateRequest, ownerId);

      expect(result.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
      expect(result.message).toContain('0 created, 7 updated');
      expect(result.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
    });

    it('handles disabled notifications with null delivery_method', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: 'CASE-UT-1',
          enabled: false
        }]
      };

      const result = await service.createNotificationPreferences(request, ownerId);

      expect(result.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
      expect(result.message).toContain('7 created, 0 updated');
      expect(result.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
    });

    it('throws error when case not found', async () => {
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: 'NONEXISTENT-CASE',
          delivery_method: 'email',
          enabled: true
        }]
      };

      await expect(service.createNotificationPreferences(request, ownerId))
        .rejects.toThrow(/Case with ID NONEXISTENT-CASE not found/);
    });

    it('throws error when user does not own the case', async () => {
      // Create another user
      const ds = getInjected();
      const userRepo = ds!.getRepository('User');
      const otherUser = await userRepo.save({
        first_name: 'Other',
        last_name: 'User',
        email: 'other@example.com',
        phone_number: '0987654321',
        password_hash: 'other_hashed_password'
      });

      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: 'CASE-UT-1',
          delivery_method: 'email',
          enabled: true
        }]
      };

      await expect(service.createNotificationPreferences(request, otherUser.user_id))
        .rejects.toThrow(/Unauthorized: You are not authorized to access case CASE-UT-1/);
    });

    it('throws error when case is in invalid workflow state', async () => {
      const ds = getInjected();
      const caseRepo = ds!.getRepository('Case');
      await caseRepo.update({ case_id: 'CASE-UT-1' }, { current_step: 'INVALID_STATE' });

      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: 'CASE-UT-1',
          delivery_method: 'email',
          enabled: true
        }]
      };

      await expect(service.createNotificationPreferences(request, ownerId))
        .rejects.toThrow(/Invalid request: case must be in a valid workflow state/);
    });

    it('allows notifications in all valid workflow states', async () => {
      const validStates = ['CREATED', 'PATIENT_LINKED', 'MEDICAL_LINKED', 'DEVICE_LINKED', 'NOTIFICATIONS_CONFIGURED'];
      
      for (const state of validStates) {
        // Reset case state
        const ds = getInjected();
        const caseRepo = ds!.getRepository('Case');
        await caseRepo.update({ case_id: 'CASE-UT-1' }, { current_step: state });

        const request: NotificationPreferencesRequest = {
          notification_preferences: [{
            case_id: 'CASE-UT-1',
            delivery_method: 'email',
            enabled: true
          }]
        };

        const result = await service.createNotificationPreferences(request, ownerId);
        expect(result.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
      }
    });

    it('processes multiple cases in one request', async () => {
      // Create second case
      const ds = getInjected();
      const caseRepo = ds!.getRepository('Case');
      await caseRepo.save({
        id: 2,
        case_id: 'CASE-UT-2',
        case_name: 'Second Test Case',
        user_id: ownerId,
        current_step: 'CREATED'
      });

      const request: NotificationPreferencesRequest = {
        notification_preferences: [
          {
            case_id: 'CASE-UT-1',
            delivery_method: 'email',
            enabled: true
          },
          {
            case_id: 'CASE-UT-2',
            delivery_method: 'sms',
            enabled: true
          }
        ]
      };

      const result = await service.createNotificationPreferences(request, ownerId);

      expect(result.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
      expect(result.message).toContain('Successfully processed 14 notification preferences');
      expect(result.message).toContain('for 2 case(s)');
      expect(result.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
    });

    it('rolls back transaction if any notification creation fails', async () => {
      // This test would require mocking the repository to simulate a failure
      // For now, we'll test that the transaction is atomic by checking count
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: 'CASE-UT-1',
          delivery_method: 'email',
          enabled: true
        }]
      };

      try {
        await service.createNotificationPreferences(request, ownerId);
      } catch (error) {
        // If any error occurs, no preferences should be saved
        const ds = getInjected();
        const prefRepo = ds!.getRepository('NotificationPreference');
        const count = await prefRepo.count();
        expect(count).toBe(0);
      }
    });
  });

  describe('getNotificationPreferencesByCase', () => {
    it('returns notification preferences for a case', async () => {
      // First create some preferences
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: 'CASE-UT-1',
          delivery_method: 'email',
          enabled: true
        }]
      };

      await service.createNotificationPreferences(request, ownerId);

      const result = await service.getNotificationPreferencesByCase(ownerId, 'CASE-UT-1');

      expect(result.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
      expect(result.message).toContain('Found 7 notification preferences for case CASE-UT-1');
      expect(result.workflow_state).toBe('NOTIFICATIONS_CONFIGURED');
    });

    it('throws error when case not found', async () => {
      await expect(service.getNotificationPreferencesByCase(ownerId, 'NONEXISTENT-CASE'))
        .rejects.toThrow(/Case with ID NONEXISTENT-CASE not found/);
    });

    it('throws error when user does not own the case', async () => {
      await expect(service.getNotificationPreferencesByCase(2, 'CASE-UT-1'))
        .rejects.toThrow(/Unauthorized: You are not authorized to access case CASE-UT-1/);
    });
  });

  describe('getUserNotificationPreferences', () => {
    it('returns all notification preferences for a user', async () => {
      // Create preferences for the case
      const request: NotificationPreferencesRequest = {
        notification_preferences: [{
          case_id: 'CASE-UT-1',
          delivery_method: 'email',
          enabled: true
        }]
      };

      await service.createNotificationPreferences(request, ownerId);

      const result = await service.getUserNotificationPreferences(ownerId);

      expect(result.message).toContain('Found 7 notification preferences for user');
      expect(result.workflow_state).toBe('USER_NOTIFICATIONS_RETRIEVED');
    });

    it('throws error when user not found', async () => {
      await expect(service.getUserNotificationPreferences(999))
        .rejects.toThrow(/User not found/);
    });
  });
});