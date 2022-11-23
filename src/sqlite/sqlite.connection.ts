import { ResultSet } from './result.set';

export const TRANSACTION_WAIT_TIMEOUT = 30000;
export const TRANSACTION_CHECK_INTERVAL = 100;

export const delay = (millis: number) =>
  new Promise((resolve) => {
    setTimeout((_) => resolve(_), millis);
  });

export interface SqliteConnection {
  executeSql(sql: string, params: any[]): Promise<ResultSet>;
  runInTransaction(runnable: () => void): Promise<void>;
  close(): Promise<void>;
}
