import { CaseService } from '../../src/services/caseService';
import { UserRepository } from '../../src/database/repositories';

describe('CaseService', () => {
  let ownerId: number;
  beforeEach(async () => {
    const userRepo = new UserRepository();
    const user = await userRepo.create({ first_name: 'A', last_name: 'B', email: 'a@b.com', phone_number: '1', password_hash: 'x' } as any);
    ownerId = (user as any).user_id;
  });

  it('creates a case with CREATED state', async () => {
    const svc = new CaseService();
    const res = await svc.createCase({ case_id: 'CASE-TEST-UT', case_name: 'UT' } as any, ownerId);
    expect(res.case_id).toBe('CASE-TEST-UT');
    expect(res.workflow_state).toBe('CREATED');
  });

  it('throws when repository update fails for existing case', async () => {
    const svc = new CaseService();
    await svc.createCase({ case_id: 'CASE-UPD-FAIL', case_name: 'Name' } as any, ownerId);
    const spy = jest.spyOn((svc as any).caseRepository.constructor.prototype, 'update').mockResolvedValueOnce(null as any);
    await expect(
      svc.createCase({ case_id: 'CASE-UPD-FAIL', case_name: 'New Name' } as any, ownerId)
    ).rejects.toThrow(/failed to update case/i);
    spy.mockRestore();
  });

  it('returns null when getCaseByCaseCode does not find a case', async () => {
    const svc = new CaseService();
    const res = await svc.getCaseByCaseCode('NON-EXISTENT-CODE');
    expect(res).toBeNull();
  });
});