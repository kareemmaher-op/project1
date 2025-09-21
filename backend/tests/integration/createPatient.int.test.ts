import { createHttpRequest, createInvocationContext, parseJsonBodyFromResponse } from '../helpers/azureFunctionMocks';
import { createPatientHandler } from '../../src/functions/createPatient';
import { createCaseHandler } from '../../src/functions/createCase';
import { UserRepository } from '../../src/database/repositories';

describe('Integration: createPatient handler', () => {
  let userRepo: UserRepository;
  let userId: number;
  let caseId: string;

  beforeEach(async () => {
    userRepo = new UserRepository();
    const user = await userRepo.create({ first_name: 'A', last_name: 'B', email: 'a@b.com', phone_number: '1', password_hash: 'x' } as any);
    userId = user.user_id;

    // create case
    const reqCase = createHttpRequest('POST', 'http://localhost/api/cases', { case_id: 'CASE-PAT-INT', case_name: 'Case P' }, { 'x-user-id': String(userId) });
    const ctxCase = createInvocationContext();
    const respCase = await (createCaseHandler as any)(reqCase, ctxCase);
    const bodyCase = await parseJsonBodyFromResponse(respCase);
    caseId = bodyCase.data.case_id;
  });

  it('requires auth', async () => {
    const req = createHttpRequest('POST', 'http://localhost/api/patients', { case_id: caseId, first_name: 'John', last_name: 'Doe', date_of_birth: '1990-01-01', location: 'CA', postal_code: 'A1A 1A1' });
    const ctx = createInvocationContext();
    const resp = await (createPatientHandler as any)(req, ctx);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(401);
    expect(body.message).toBe('Unauthorized');
  });

  it('validates body', async () => {
    const req = createHttpRequest('POST', 'http://localhost/api/patients', { case_id: caseId, first_name: '', last_name: '', date_of_birth: 'bad', location: '', postal_code: '' }, { 'x-user-id': String(userId) });
    const ctx = createInvocationContext();
    const resp = await (createPatientHandler as any)(req, ctx);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(400);
    expect(body.message).toBe('Validation failed');
    const errs = JSON.parse(body.error);
    expect(errs.first_name).toBeDefined();
    expect(errs.last_name).toBeDefined();
    expect(errs.date_of_birth).toBeDefined();
    expect(errs.location).toBeDefined();
    expect(errs.postal_code).toBeDefined();
  });

  it('creates/links patient and updates case step', async () => {
    const req = createHttpRequest('POST', 'http://localhost/api/patients', { case_id: caseId, first_name: 'Jane', last_name: 'Doe', date_of_birth: '1990-01-01', location: 'CA', postal_code: 'A1A 1A1' }, { 'x-user-id': String(userId) });
    const ctx = createInvocationContext();
    const resp = await (createPatientHandler as any)(req, ctx);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.workflow_state).toBe('PATIENT_LINKED');
  });

  it('returns 401 when updating linked patient owned by another user', async () => {
    // Link by userId first
    const linkReq = createHttpRequest('POST', 'http://localhost/api/patients', { case_id: caseId, first_name: 'Owner', last_name: 'One', date_of_birth: '1990-01-01', location: 'CA', postal_code: 'A1A 1A1' }, { 'x-user-id': String(userId) });
    const linkCtx = createInvocationContext();
    await (createPatientHandler as any)(linkReq, linkCtx);

    // Create another user
    const userRepo2 = new UserRepository();
    const u2 = await userRepo2.create({ first_name: 'X', last_name: 'Y', email: 'xy@z.com', phone_number: '9', password_hash: 'x' } as any);

    // Attempt update with other user (should hit case ownership check and return 401)
    const badReq = createHttpRequest('POST', 'http://localhost/api/patients', { case_id: caseId, first_name: 'Hacker', last_name: 'Two', date_of_birth: '1990-01-01', location: 'CA', postal_code: 'A1A 1A1' }, { 'x-user-id': String(u2.user_id) });
    const badCtx = createInvocationContext();
    const resp = await (createPatientHandler as any)(badReq, badCtx);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(401);
    expect(body.message.toLowerCase()).toContain('unauthorized');
  });

  it('returns 400 for invalid JSON body', async () => {
    const hdrs = { 'x-user-id': String(userId) };
    const headers = new Map<string, string>();
    Object.entries(hdrs).forEach(([k, v]) => headers.set(k.toLowerCase(), v));
    const req: any = {
      method: 'POST',
      url: 'http://localhost/api/patients',
      headers: { get: (k: string) => headers.get(k.toLowerCase()) || null, has: (k: string) => headers.has(k.toLowerCase()) } as any,
      query: new URL('http://localhost/api/patients').searchParams,
      text: async () => '{bad-json',
    };
    const ctx = createInvocationContext();
    const resp = await (createPatientHandler as any)(req, ctx);
    expect(resp.status).toBe(400);
  });
});

