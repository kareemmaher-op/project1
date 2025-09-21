import { MedicationService } from '../../src/services/medicationService';
import { CaseService } from '../../src/services/caseService';
import { PatientService } from '../../src/services/patientService';
import { UserRepository } from '../../src/database/repositories';

describe('MedicationService', () => {
  let ownerId: number;
  let otherUserId: number;

  beforeEach(async () => {
    const userRepo = new UserRepository();
    const owner = await userRepo.create({ first_name: 'U', last_name: 'One', email: 'u1@example.com', phone_number: '1', password_hash: 'x' } as any);
    ownerId = (owner as any).user_id;
    const other = await userRepo.create({ first_name: 'V', last_name: 'Two', email: 'u2@example.com', phone_number: '2', password_hash: 'y' } as any);
    otherUserId = (other as any).user_id;

    const caseSvc = new CaseService();
    await caseSvc.createCase({ case_id: 'CASE-MED-UT-1', case_name: 'MED' } as any, ownerId);

    // Link patient so workflow allows medication (PATIENT_LINKED)
    const patientSvc = new PatientService();
    await patientSvc.createPatient({
      first_name: 'John', last_name: 'Doe', date_of_birth: '1990-01-01',
      location: 'Canada', postal_code: 'A1A1A1', case_id: 'CASE-MED-UT-1'
    } as any, ownerId);
  });

  it('creates medication and sets MEDICAL_LINKED', async () => {
    const svc = new MedicationService();
    const res = await svc.createMedication({
      case_id: 'CASE-MED-UT-1', spray_number: 1,
      expiration_date_spray_1: '2026-01-31', expiration_date_spray_2: '2026-06-30',
      dosage_details: '2 sprays/day'
    } as any, ownerId);
    expect(res.workflow_state).toBe('MEDICAL_LINKED');
    expect(res.spray_number).toBe(1);
  });

  it('updates existing medication for same spray_number', async () => {
    const svc = new MedicationService();
    await svc.createMedication({
      case_id: 'CASE-MED-UT-1', spray_number: 1,
      expiration_date_spray_1: '2026-01-31', expiration_date_spray_2: '2026-06-30',
      dosage_details: '2 sprays/day'
    } as any, ownerId);
    const updated = await svc.createMedication({
      case_id: 'CASE-MED-UT-1', spray_number: 1,
      expiration_date_spray_1: '2026-02-29', expiration_date_spray_2: '2026-07-31',
      dosage_details: '1–2 sprays/day'
    } as any, ownerId);
    expect(updated.expiration_date_spray_1).toBeTruthy();
  });

  it('update keeps existing dosage when undefined', async () => {
    const svc = new MedicationService();
    const created = await svc.createMedication({
      case_id: 'CASE-MED-UT-1', spray_number: 2,
      expiration_date_spray_1: '2026-01-31', expiration_date_spray_2: '2026-06-30',
      dosage_details: 'initial'
    } as any, ownerId);
    const updated = await svc.createMedication({
      case_id: 'CASE-MED-UT-1', spray_number: 2,
      expiration_date_spray_1: '2027-01-31', expiration_date_spray_2: '2027-06-30'
    } as any, ownerId);
    expect(updated.dosage_details).toBe('initial');
  });

  it('throws unauthorized for non-owner', async () => {
    const svc = new MedicationService();
    await expect(svc.createMedication({
      case_id: 'CASE-MED-UT-1', spray_number: 2,
      expiration_date_spray_1: '2026-01-31', expiration_date_spray_2: '2026-06-30'
    } as any, otherUserId)).rejects.toThrow(/Unauthorized/);
  });

  it('throws case not found for invalid case code', async () => {
    const svc = new MedicationService();
    await expect(svc.createMedication({
      case_id: 'CASE-NOT-EXIST', spray_number: 1,
      expiration_date_spray_1: '2026-01-31', expiration_date_spray_2: '2026-06-30'
    } as any, ownerId)).rejects.toThrow(/Case not found/);
  });

  it('throws invalid workflow if case not in allowed step', async () => {
    // Create a new case (CREATED) without linking a patient
    const caseSvc = new CaseService();
    await caseSvc.createCase({ case_id: 'CASE-MED-UT-2', case_name: 'CREATED ONLY' } as any, ownerId);
    const svc = new MedicationService();
    await expect(svc.createMedication({
      case_id: 'CASE-MED-UT-2', spray_number: 1,
      expiration_date_spray_1: '2026-01-31', expiration_date_spray_2: '2026-06-30'
    } as any, ownerId)).rejects.toThrow(/Invalid request: invalid workflow step/);
  });
});