import type { ResultSet } from './result.set';

const { RnSqlite } = NativeModules;

import { NativeModules } from 'react-native';
import { SqliteConnection } from './sqlite.connection';

export class SQLite implements SqliteConnection {
  private readonly uid: String;
  constructor(uid: String) {
    this.uid = uid;
  }

  public async executeSql(sql: string, params: any[]): Promise<ResultSet> {
    return await RnSqlite.executeSql(this.uid, sql, params);
  }

  public async runInTransaction(runnable: () => void): Promise<void> {
    try {
      await RnSqlite.beginTransaction(this.uid);
      await runnable();
      await RnSqlite.commitTransaction(this.uid);
    } finally {
      await RnSqlite.endTransaction(this.uid);
    }
  }

  public async close(): Promise<void> {
    return await RnSqlite.closeDatabase(this.uid);
  }
}
