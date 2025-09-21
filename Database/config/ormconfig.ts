import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, Patient, Case, Medication, NotificationPreference, EmergencyContact, InvitedUser } from '../entities';
import * as dotenv from 'dotenv';

dotenv.config();

// Database configuration for different environments
const config = {
  development: {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'episure_db',
    synchronize: false, // Use migrations instead
    logging: true,
    entities: [User, Patient, Case, Medication, NotificationPreference, EmergencyContact, InvitedUser],
    migrations: ['migrations/**/*.ts'],
    subscribers: ['subscribers/**/*.ts'],
    migrationsTableName: 'migrations_history',
    // Enable soft delete globally
    deleteDateColumn: 'deleted_at',
  },
  test: {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST || 'episure_test_db',
    synchronize: false,
    logging: false,
    entities: [User, Patient, Case, Medication, NotificationPreference, EmergencyContact, InvitedUser],
    migrations: ['migrations/**/*.ts'],
    subscribers: ['subscribers/**/*.ts'],
    migrationsTableName: 'migrations_history',
    // Enable soft delete globally
    deleteDateColumn: 'deleted_at',
  },
  production: {
    type: 'postgres' as const,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: false,
    logging: false,
    entities: [User, Patient, Case, Medication, NotificationPreference, EmergencyContact, InvitedUser],
    migrations: ['migrations/**/*.ts'],
    subscribers: ['subscribers/**/*.ts'],
    migrationsTableName: 'migrations_history',
    // Enable soft delete globally
    deleteDateColumn: 'deleted_at',
    ssl: {
      rejectUnauthorized: false
    }
  }
};

const environment = process.env.NODE_ENV || 'development';
const currentConfig = config[environment as keyof typeof config];

const AppDataSource = new DataSource(currentConfig);

export default AppDataSource;