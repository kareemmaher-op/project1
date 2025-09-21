import { DataSource } from 'typeorm';

let injected: DataSource | null = null;

export async function setTestDataSource(ds: DataSource | null) {
  injected = ds;
  return injected;
}

export function getInjected() {
  return injected;
}