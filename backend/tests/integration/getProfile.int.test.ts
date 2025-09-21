import { createHttpRequest, createInvocationContext, parseJsonBodyFromResponse } from '../helpers/azureFunctionMocks';
import { getProfileHandler } from '../../src/functions/getProfile';
import { UserRepository } from '../../src/database/repositories';

describe('Integration: getProfile handler', () => {
  let userRepo: UserRepository;
  let userId: number;

  beforeEach(async () => {
    userRepo = new UserRepository();
    const u = await userRepo.create({ first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', phone_number: '+1000000000', password_hash: 'hash' } as any);
    userId = u.user_id;
  });

  it('returns 401 when auth missing', async () => {
    const req = createHttpRequest('GET', 'http://localhost/api/me/profile');
    const ctx = createInvocationContext();
    const resp = await (getProfileHandler as any)(req, ctx);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(401);
    expect(body.message).toBe('Unauthorized');
  });

  it('returns profile for authenticated user', async () => {
    const req = createHttpRequest('GET', 'http://localhost/api/me/profile', undefined, { 'x-user-id': String(userId) });
    const ctx = createInvocationContext();
    const resp = await (getProfileHandler as any)(req, ctx);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      userId: userId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    });
  });

  it('returns 401 for non-existing user id in auth', async () => {
    const req = createHttpRequest('GET', 'http://localhost/api/me/profile', undefined, { 'x-user-id': String(9999) });
    const ctx = createInvocationContext();
    const resp = await (getProfileHandler as any)(req, ctx);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(401);
    expect(body.message.toLowerCase()).toContain('unauthorized');
  });
});

