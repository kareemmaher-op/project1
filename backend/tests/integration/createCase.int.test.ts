import { createHttpRequest, createInvocationContext, parseJsonBodyFromResponse } from '../helpers/azureFunctionMocks';
import { createCaseHandler } from '../../src/functions/createCase';
import { UserRepository } from '../../src/database/repositories';

describe('Integration: createCase handler', () => {
  let userRepo: UserRepository;
  let userId: number;

  beforeEach(async () => {
    userRepo = new UserRepository();
    const user = await userRepo.create({ first_name: 'A', last_name: 'B', email: 'a@b.com', phone_number: '1', password_hash: 'x' } as any);
    userId = user.user_id;
  });

  it('returns 401 when auth header missing', async () => {
    const req = createHttpRequest('POST', 'http://localhost/api/cases', { case_id: 'C-1', case_name: 'My Case' });
    const ctx = createInvocationContext();
    const resp = await (createCaseHandler as any)(req, ctx);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(401);
    expect(body.message).toBe('Unauthorized');
  });

  it('returns 400 on validation errors', async () => {
    const req = createHttpRequest('POST', 'http://localhost/api/cases', { case_id: '', case_name: '' }, { 'x-user-id': String(userId) });
    const ctx = createInvocationContext();
    const resp = await (createCaseHandler as any)(req, ctx);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(400);
    expect(body.message).toBe('Validation failed');
    expect(body.error).toBeDefined();
    const fieldErrors = JSON.parse(body.error);
    expect(fieldErrors.case_id).toBeDefined();
    expect(fieldErrors.case_name).toBeDefined();
  });

  it('creates case successfully', async () => {
    const req = createHttpRequest('POST', 'http://localhost/api/cases', { case_id: 'CASE-INT-001', case_name: 'Case One' }, { 'x-user-id': String(userId) });
    const ctx = createInvocationContext();
    const resp = await (createCaseHandler as any)(req, ctx);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.case_id).toBe('CASE-INT-001');
    expect(body.data.workflow_state).toBe('CREATED');
  });

  it('returns 409 when case exists and owned by another user', async () => {
    const otherUser = await userRepo.create({ first_name: 'O', last_name: 'U', email: 'o@u.com', phone_number: '2', password_hash: 'x' } as any);
    // userId creates a case
    const first = createHttpRequest('POST', 'http://localhost/api/cases', { case_id: 'CASE-CONFLICT', case_name: 'First' }, { 'x-user-id': String(userId) });
    const ctx1 = createInvocationContext();
    await (createCaseHandler as any)(first, ctx1);
    // other user attempts to create/update same case_id
    const second = createHttpRequest('POST', 'http://localhost/api/cases', { case_id: 'CASE-CONFLICT', case_name: 'Second' }, { 'x-user-id': String(otherUser.user_id) });
    const ctx2 = createInvocationContext();
    const resp = await (createCaseHandler as any)(second, ctx2);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(409);
    expect(body.message.toLowerCase()).toContain('already exists');
  });

  it('returns 400 for invalid JSON body', async () => {
    const hdrs = { 'x-user-id': String(userId) };
    const headers = new Map<string, string>();
    Object.entries(hdrs).forEach(([k, v]) => headers.set(k.toLowerCase(), v));
    const req: any = {
      method: 'POST',
      url: 'http://localhost/api/cases',
      headers: { get: (k: string) => headers.get(k.toLowerCase()) || null, has: (k: string) => headers.has(k.toLowerCase()) } as any,
      query: new URL('http://localhost/api/cases').searchParams,
      text: async () => '{bad-json',
    };
    const ctx = createInvocationContext();
    const resp = await (createCaseHandler as any)(req, ctx);
    expect(resp.status).toBe(400);
  });
});

