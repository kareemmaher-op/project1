import { newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { Case } from '../../src/database/entities/Case';
import { Patient } from '../../src/database/entities/Patient';
import { Medication } from '../../src/database/entities/Medication';
import { User } from '../../src/database/entities/User';
import { NotificationPreference } from '../../src/database/entities/NotificationPreference';
import { EmergencyContact } from '../../src/database/entities/EmergencyContact';
import { InvitedUser } from '../../src/database/entities/InvitedUser';

export function createPgMemDataSource(): DataSource {
  const db = newDb({ autoCreateForeignKeyIndices: true });
  // Register minimal functions used by TypeORM Postgres driver
  db.public.registerFunction({ name: 'version', args: [], implementation: () => 'PostgreSQL 14.0 on pg-mem' });
  db.public.registerFunction({ name: 'current_database', args: [], implementation: () => 'pg_mem_db' });

  const anyDb: any = db as any;
  const ds: DataSource = anyDb.adapters.createTypeormDataSource
    ? anyDb.adapters.createTypeormDataSource({
        type: 'postgres',
        entities: [User, Patient, Case, Medication, NotificationPreference, EmergencyContact, InvitedUser],
        synchronize: true,
        dropSchema: false,
        logging: false,
      })
    : new DataSource({
        type: 'postgres' as any,
        // @ts-ignore - pg-mem driver
        driver: db.adapters.createPg(),
        entities: [User, Patient, Case, Medication, NotificationPreference, EmergencyContact, InvitedUser],
        synchronize: true,
        dropSchema: false,
        logging: false,
      } as any);

  return ds;
}

export async function clearAllTables(ds: DataSource) {
  const qr = ds.createQueryRunner();
  try {
    await qr.startTransaction();
    // Delete children first to satisfy FK constraints
    await qr.query('DELETE FROM invited_users');
    await qr.query('DELETE FROM emergency_contacts');
    await qr.query('DELETE FROM notification_preferences');
    await qr.query('DELETE FROM medications');
    await qr.query('DELETE FROM cases');
    await qr.query('DELETE FROM patients');
    await qr.query('DELETE FROM users');
    await qr.commitTransaction();
  } catch (e) {
    await qr.rollbackTransaction();
    throw e;
  } finally {
    await qr.release();
  }
}