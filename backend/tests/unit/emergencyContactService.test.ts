import { EmergencyContactService } from '../../src/services/emergencyContactService';
import { CaseService } from '../../src/services/caseService';
import { UserRepository, InvitedUserRepository, EmergencyContactRepository } from '../../src/database/repositories';

describe('EmergencyContactService (unit)', () => {
  let ownerId: number;
  let otherUserId: number;
  const caseCode = 'CASE-EC-UT-1';

  beforeEach(async () => {
    const userRepo = new UserRepository();
    const owner = await userRepo.create({ first_name: 'Owner', last_name: 'One', email: 'owner1@example.com', phone_number: '+10000000001', password_hash: 'x' } as any);
    ownerId = (owner as any).user_id;
    const other = await userRepo.create({ first_name: 'Other', last_name: 'Two', email: 'other2@example.com', phone_number: '+10000000002', password_hash: 'y' } as any);
    otherUserId = (other as any).user_id;

    const cs = new CaseService();
    await cs.createCase({ case_id: caseCode, case_name: 'EC Unit' } as any, ownerId);
  });

  it('creates new emergency contacts and optionally creates invites', async () => {
    const svc = new EmergencyContactService();
    const res = await svc.createEmergencyContacts({
      caseCode,
      contacts: [
        { first_name: 'John', last_name: 'Doe', email: 'john.ut@example.com', phone_number: '+12345678901', send_invite: true },
        { first_name: 'Jane', last_name: 'Roe', email: 'jane.ut@example.com', phone_number: '+12345678902', send_invite: false }
      ],
      createdByUserId: ownerId
    });

    expect(res.saved.length).toBe(2);
    const inviteRepo = new InvitedUserRepository();
    const hasInvite1 = await inviteRepo.existsEmailForCase((res.saved[0] as any).case_id, 'john.ut@example.com');
    const hasInvite2 = await inviteRepo.existsEmailForCase((res.saved[1] as any).case_id, 'jane.ut@example.com');
    expect(hasInvite1).toBe(true);
    expect(hasInvite2).toBe(false);
  });

  it('upserts existing contact when email already exists (updates fields)', async () => {
    const svc = new EmergencyContactService();
    // First create
    await svc.createEmergencyContacts({
      caseCode,
      contacts: [{ first_name: 'A', last_name: 'B', email: 'dup.ut@example.com', phone_number: '+12345678903', send_invite: false }],
      createdByUserId: ownerId
    });

    // Update with same email
    const res2 = await svc.createEmergencyContacts({
      caseCode,
      contacts: [{ first_name: 'A2', last_name: 'B2', email: 'dup.ut@example.com', phone_number: '+12345678909', send_invite: true }],
      createdByUserId: ownerId
    });

    expect(res2.saved.length).toBe(1);
    const contactRepo = new EmergencyContactRepository();
    const caseId = (res2.saved[0] as any).case_id;
    const updated = await contactRepo.findByCaseAndEmail(caseId, 'dup.ut@example.com');
    expect(updated?.first_name).toBe('A2');
    expect(updated?.last_name).toBe('B2');
    expect(updated?.phone_number).toBe('+12345678909');
    expect(updated?.invite_sent).toBe(true);
  });

  it('throws unauthorized when case not owned by user', async () => {
    const svc = new EmergencyContactService();
    await expect(svc.createEmergencyContacts({
      caseCode,
      contacts: [{ first_name: 'H', last_name: 'X', email: 'h@x.com', phone_number: '+12345678904' }],
      createdByUserId: otherUserId
    })).rejects.toThrow(/Unauthorized/i);
  });

  it('throws 404 when user not found', async () => {
    const svc = new EmergencyContactService();
    await expect(svc.createEmergencyContacts({
      caseCode,
      contacts: [{ first_name: 'H', last_name: 'X', email: 'h@x.com', phone_number: '+12345678904' }],
      createdByUserId: 999999
    })).rejects.toThrow(/User not found/);
  });
});

