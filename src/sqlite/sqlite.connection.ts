import { ResultSet } from './result.set';

export interface SqliteConnection {
  executeSql(sql: string, params: any[]): Promise<ResultSet>;
  runInTransaction(runnable: () => void): Promise<void>;
  close(): Promise<void>;
}
