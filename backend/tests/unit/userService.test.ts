import { DataSource } from 'typeorm';
import { createPgMemDataSource, clearAllTables } from '../helpers/testDataSource.pgmem';
import { User } from '../../src/database/entities/User';
import { UserService } from '../../src/services/userService';
import * as dbConfig from '../../src/database/config/database';

describe('UserService (unit) - getProfile', () => {
  let ds: DataSource;

  beforeAll(async () => {
    ds = createPgMemDataSource();
    await ds.initialize();
    jest.spyOn(dbConfig, 'initializeDatabase' as any).mockResolvedValue(undefined as any);
    jest.spyOn(dbConfig, 'getDatabase' as any).mockResolvedValue(ds as any);
  });

  beforeEach(async () => {
    await clearAllTables(ds);
    const u = new User();
    u.user_id = 1;
    u.first_name = 'John';
    u.last_name = 'Doe';
    u.email = 'john.doe@example.com';
    u.phone_number = '+1000000000';
    u.password_hash = 'hash';
    await ds.getRepository(User).save(u);
  });

  afterAll(async () => {
    await ds.destroy();
    jest.restoreAllMocks();
  });

  it('returns profile for existing user', async () => {
    const svc = new UserService();
    const profile = await svc.getProfile(1);
    expect(profile).toEqual({
      userId: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    });
  });

  it('throws Unauthorized when user not found', async () => {
    const svc = new UserService();
    await expect(svc.getProfile(999)).rejects.toThrow('Unauthorized: user not found');
  });
});

