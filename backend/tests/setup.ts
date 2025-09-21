import { createPgMemDataSource, clearAllTables } from './helpers/testDataSource.pgmem';
import { setTestDataSource, getInjected } from './helpers/testBridge';
import * as appDb from '../src/database/config/database';

// Mock Azure Functions app registration to avoid test-mode warnings and side effects
jest.mock('@azure/functions', () => {
  const actual = jest.requireActual('@azure/functions');
  return {
    ...actual,
    app: {
      http: jest.fn(),
    },
  };
});

// Filter noisy warnings from @azure/functions in test mode
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const msg = String(args[0] ?? '');
  if (msg.includes('Failed to detect the Azure Functions runtime') ||
      msg.includes('Skipping call to register function')) {
    return; // suppress
  }
  originalWarn(...args);
};

beforeAll(async () => {
  const ds = createPgMemDataSource();
  await ds.initialize();
  await setTestDataSource(ds);
  // @ts-ignore use injected DS
  appDb.getDatabase = async () => getInjected() ?? (await (appDb as any).getDatabase());
  // @ts-ignore use injected DS
  appDb.getTransactionManager = async () => {
    const injected = getInjected();
    return injected ? injected.manager : (await (appDb as any).getDatabase()).manager;
  };
});

beforeEach(async () => {
  const ds = getInjected();
  if (ds) await clearAllTables(ds);
});

afterAll(async () => {
  const ds = getInjected();
  if (ds?.isInitialized) await ds.destroy();
  await setTestDataSource(null as any);
  // Give event loop a tick to settle
  await new Promise((r) => setTimeout(r, 0));
});