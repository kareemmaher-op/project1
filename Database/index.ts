import 'reflect-metadata';
import { databaseManager } from './database-manager';
import * as dotenv from 'dotenv';

dotenv.config();

const initDatabase = async () => {
  await databaseManager.initDatabase();
};

// Run the initialization if this file is executed directly
if (require.main === module) {
  initDatabase();
}

export { initDatabase, databaseManager };