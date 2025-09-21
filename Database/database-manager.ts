import 'reflect-metadata';
import { DataSource } from 'typeorm';
import AppDataSource from './config/ormconfig';
import * as dotenv from 'dotenv';

dotenv.config();

export class DatabaseManager {
  private masterDataSource: DataSource | null = null;

  // Create master connection for database creation (PostgreSQL)
  private createMasterDataSource(): DataSource {
    return new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: 'postgres', // Connect to default postgres database
      logging: process.env.NODE_ENV === 'development',
    });
  }

  async initDatabase(): Promise<void> {
    try {
      console.log('🔄 Starting database initialization...');

      // Step 1: Connect to master database
      this.masterDataSource = this.createMasterDataSource();
      await this.masterDataSource.initialize();
      console.log('✅ Connected to master PostgreSQL database.');

      // Step 2: Check if target database exists, create if not
      const dbName = process.env.DB_NAME || 'episure_db';
      
      const checkDbQuery = `
        SELECT 1 FROM pg_database WHERE datname = $1
      `;
      
      const dbExists = await this.masterDataSource.query(checkDbQuery, [dbName]);
      
      if (dbExists.length === 0) {
        console.log(`🔨 Creating database: ${dbName}`);
        await this.masterDataSource.query(`CREATE DATABASE "${dbName}"`);
        console.log(`✅ Database '${dbName}' created successfully.`);
      } else {
        console.log(`✅ Database '${dbName}' already exists.`);
      }

      // Step 3: Close master connection
      await this.masterDataSource.destroy();
      console.log('🔌 Master database connection closed.');

      // Step 4: Wait a moment for database to be fully ready
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 5: Connect to target database
      await AppDataSource.initialize();
      console.log(`✅ Connected to target database: ${dbName}`);

      // Step 6: Run migrations
      console.log('🔄 Running migrations...');
      await AppDataSource.runMigrations();
      console.log('✅ Migrations executed successfully.');

      // Step 7: Verify entities from database
      console.log('📋 Available entities:');
      const entities = AppDataSource.entityMetadatas;
      for (const entity of entities) {
        const count = await AppDataSource.getRepository(entity.target).count();
        console.log(`  ✅ ${entity.tableName} (${count} records)`);
      }

      // Step 8: Close connection
      await AppDataSource.destroy();
      console.log('🔌 Target database connection closed.');
      
      console.log('🎉 Database initialization completed successfully!');

    } catch (error) {
      console.error('❌ Error during database initialization:', error);
      
      // Cleanup connections on error
      if (this.masterDataSource?.isInitialized) {
        await this.masterDataSource.destroy();
      }
      if (AppDataSource?.isInitialized) {
        await AppDataSource.destroy();
      }
      
      process.exit(1);
    }
  }
}

// Export singleton instance
export const databaseManager = new DatabaseManager();