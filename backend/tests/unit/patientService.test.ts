import { PatientService } from '../../src/services/patientService';
import { CaseService } from '../../src/services/caseService';
import { UserRepository } from '../../src/database/repositories';

describe('PatientService', () => {
  let ownerId: number;
  let otherUserId: number;

  beforeEach(async () => {
    const userRepo = new UserRepository();
    const owner = await userRepo.create({ first_name: 'U', last_name: 'One', email: 'u1@example.com', phone_number: '1', password_hash: 'x' } as any);
    ownerId = (owner as any).user_id;
    const other = await userRepo.create({ first_name: 'V', last_name: 'Two', email: 'u2@example.com', phone_number: '2', password_hash: 'y' } as any);
    otherUserId = (other as any).user_id;
    const cs = new CaseService();
    await cs.createCase({ case_id: 'CASE-PT-UT-1', case_name: 'PT' } as any, ownerId);
  });

  it('links new patient and sets PATIENT_LINKED', async () => {
    const svc = new PatientService();
    const res = await svc.createPatient({
      first_name: 'John', last_name: 'Doe', date_of_birth: '1990-01-01',
      location: 'Canada', postal_code: 'A1A1A1', case_id: 'CASE-PT-UT-1'
    } as any, ownerId);
    expect(res.workflow_state).toBe('PATIENT_LINKED');
    expect(res.first_name).toBe('John');
  });

  it('throws unauthorized when case not owned by user', async () => {
    const svc = new PatientService();
    await expect(svc.createPatient({
      first_name: 'A', last_name: 'B', date_of_birth: '1990-01-01',
      location: 'Canada', postal_code: 'A1A1A1', case_id: 'CASE-PT-UT-1'
    } as any, otherUserId)).rejects.toThrow(/Unauthorized/i);
  });

  it('throws 404 when user not found', async () => {
    const svc = new PatientService();
    await expect(svc.createPatient({
      first_name: 'A', last_name: 'B', date_of_birth: '1990-01-01',
      location: 'Canada', postal_code: 'A1A1A1', case_id: 'CASE-PT-UT-1'
    } as any, 999)).rejects.toThrow(/User not found/);
  });

  it('reuses existing patient identity for same user', async () => {
    const svc = new PatientService();
    const first = await svc.createPatient({
      first_name: 'Jane', last_name: 'Roe', date_of_birth: '1988-06-06',
      location: 'Canada', postal_code: 'A1A1A1', case_id: 'CASE-PT-UT-1'
    } as any, ownerId);
    const second = await svc.createPatient({
      first_name: 'Jane', last_name: 'Roe', date_of_birth: '1988-06-06',
      location: 'Canada', postal_code: 'A1A1A1', case_id: 'CASE-PT-UT-1'
    } as any, ownerId);
    expect(second.patient_id).toEqual(first.patient_id);
  });

  it('reuse path keeps optional fields when undefined', async () => {
    const svc = new PatientService();
    // First create
    const first = await svc.createPatient({
      first_name: 'Keep', last_name: 'Same', date_of_birth: '1980-01-01',
      location: 'Canada', postal_code: 'A1A1A1', case_id: 'CASE-PT-UT-1',
      invite_email: 'inv@example.com', allergies_medical_history: 'none', is_self: false
    } as any, ownerId);
    // Create again with optional fields omitted; should keep old ones
    const second = await svc.createPatient({
      first_name: 'Keep', last_name: 'Same', date_of_birth: '1980-01-01',
      location: 'Canada', postal_code: 'A1A1A1', case_id: 'CASE-PT-UT-1'
    } as any, ownerId);
    expect(second.patient_id).toEqual(first.patient_id);
    expect(second.invite_email).toBe('inv@example.com');
  });
});