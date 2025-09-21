import { createHttpRequest, createInvocationContext, parseJsonBodyFromResponse } from '../helpers/azureFunctionMocks';
import { createMedicationHandler } from '../../src/functions/createMedication';
import { createCaseHandler } from '../../src/functions/createCase';
import { createPatientHandler } from '../../src/functions/createPatient';
import { UserRepository } from '../../src/database/repositories';

describe('Integration: createMedication handler', () => {
  let userRepo: UserRepository;
  let userId: number;
  let otherUserId: number;
  let caseId: string;

  beforeEach(async () => {
    userRepo = new UserRepository();
    const u1 = await userRepo.create({ first_name: 'U', last_name: '1', email: 'u1@x.com', phone_number: '1', password_hash: 'x' } as any);
    const u2 = await userRepo.create({ first_name: 'U', last_name: '2', email: 'u2@x.com', phone_number: '2', password_hash: 'x' } as any);
    userId = u1.user_id;
    otherUserId = u2.user_id;

    // create case owned by userId
    const reqCase = createHttpRequest('POST', 'http://localhost/api/cases', { case_id: 'CASE-MED-INT', case_name: 'Case M' }, { 'x-user-id': String(userId) });
    const ctxCase = createInvocationContext();
    const respCase = await (createCaseHandler as any)(reqCase, ctxCase);
    const bodyCase = await parseJsonBodyFromResponse(respCase);
    caseId = bodyCase.data.case_id;

    // link patient to enable medication step
    const reqPat = createHttpRequest('POST', 'http://localhost/api/patients', { case_id: caseId, first_name: 'Med', last_name: 'Pat', date_of_birth: '1990-01-01', location: 'CA', postal_code: 'A1A 1A1' }, { 'x-user-id': String(userId) });
    const ctxPat = createInvocationContext();
    await (createPatientHandler as any)(reqPat, ctxPat);
  });

  it('requires auth', async () => {
    const req = createHttpRequest('POST', 'http://localhost/api/medications', { case_id: caseId, spray_number: 1, expiration_date_spray_1: '2026-01-01', expiration_date_spray_2: '2026-06-01' });
    const ctx = createInvocationContext();
    const resp = await (createMedicationHandler as any)(req, ctx);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(401);
    expect(body.message).toBe('Unauthorized');
  });

  it('validates body', async () => {
    const req = createHttpRequest('POST', 'http://localhost/api/medications', { case_id: '', spray_number: 3, expiration_date_spray_1: 'bad', expiration_date_spray_2: '' }, { 'x-user-id': String(userId) });
    const ctx = createInvocationContext();
    const resp = await (createMedicationHandler as any)(req, ctx);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(400);
    expect(body.message).toBe('Validation failed');
    const errs = JSON.parse(body.error);
    expect(errs.case_id).toBeDefined();
    expect(errs.spray_number).toBeDefined();
    expect(errs.expiration_date_spray_1).toBeDefined();
    expect(errs.expiration_date_spray_2).toBeDefined();
  });

  it('creates medication and updates case step', async () => {
    const req = createHttpRequest('POST', 'http://localhost/api/medications', { case_id: caseId, spray_number: 1, expiration_date_spray_1: '2026-01-01', expiration_date_spray_2: '2026-06-01', dosage_details: 'daily' }, { 'x-user-id': String(userId) });
    const ctx = createInvocationContext();
    const resp = await (createMedicationHandler as any)(req, ctx);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.workflow_state).toBe('MEDICAL_LINKED');
  });

  it('rejects when unauthorized user accesses case', async () => {
    const req = createHttpRequest('POST', 'http://localhost/api/medications', { case_id: caseId, spray_number: 1, expiration_date_spray_1: '2026-01-01', expiration_date_spray_2: '2026-06-01' }, { 'x-user-id': String(otherUserId) });
    const ctx = createInvocationContext();
    const resp = await (createMedicationHandler as any)(req, ctx);
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
      url: 'http://localhost/api/medications',
      headers: { get: (k: string) => headers.get(k.toLowerCase()) || null, has: (k: string) => headers.has(k.toLowerCase()) } as any,
      query: new URL('http://localhost/api/medications').searchParams,
      text: async () => '{bad-json',
    };
    const ctx = createInvocationContext();
    const resp = await (createMedicationHandler as any)(req, ctx);
    expect(resp.status).toBe(400);
  });

  it('returns 400 when case is in invalid workflow step', async () => {
    // Create a separate case that is still in CREATED (no patient linked)
    const reqCase = createHttpRequest('POST', 'http://localhost/api/cases', { case_id: 'CASE-BAD-STEP', case_name: 'Bad Step' }, { 'x-user-id': String(userId) });
    const ctxCase = createInvocationContext();
    await (createCaseHandler as any)(reqCase, ctxCase);

    const req = createHttpRequest('POST', 'http://localhost/api/medications', { case_id: 'CASE-BAD-STEP', spray_number: 1, expiration_date_spray_1: '2026-01-01', expiration_date_spray_2: '2026-06-01' }, { 'x-user-id': String(userId) });
    const ctx = createInvocationContext();
    const resp = await (createMedicationHandler as any)(req, ctx);
    const body = await parseJsonBodyFromResponse(resp);
    expect(resp.status).toBe(400);
    expect(body.message.toLowerCase()).toContain('invalid request');
  });
});

