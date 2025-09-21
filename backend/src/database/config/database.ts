import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, Patient, Case, Medication, NotificationPreference, EmergencyContact, InvitedUser } from '../entities';

let dataSource: DataSource | null = null;

// Optimized database configuration with connection pooling
function createDataSource(): DataSource {
    return new DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        username: process.env.DATABASE_USERNAME || 'postgres',
        password: process.env.DATABASE_PASSWORD || 'postgres123',
        database: process.env.DATABASE_NAME || 'episure_db',
        synchronize: false, // Always use migrations
        logging: false, // Disable query logging for performance
        entities: [User, Patient, Case, Medication, NotificationPreference, EmergencyContact, InvitedUser],
        // Connection pooling optimization
        extra: {
            max: 10, // Maximum connections in pool
            min: 2,  // Minimum connections in pool
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            acquireTimeoutMillis: 60000
        }
    });
}

// Get or create database connection (singleton pattern)
export async function getDatabase(): Promise<DataSource> {
    if (!dataSource || !dataSource.isInitialized) {
        dataSource = createDataSource();
        await dataSource.initialize();
        console.log('Database connection pool initialized');
    }
    return dataSource;
}

// Get a transaction manager for complex operations
export async function getTransactionManager() {
    const db = await getDatabase();
    return db.manager;
}

// Legacy function for backward compatibility
export async function initializeDatabase(): Promise<void> {
    await getDatabase();
}

// Close database connection
export async function closeDatabase(): Promise<void> {
    if (dataSource?.isInitialized) {
        await dataSource.destroy();
        dataSource = null;
        console.log('Database connection closed');
    }
}