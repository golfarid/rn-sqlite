import type { ResultSet } from './result-set';

const { RnSqlite } = NativeModules;

import { NativeModules } from 'react-native';

export class SQLite {
  private readonly uid: String;
  constructor(uid: String) {
    this.uid = uid;
  }

  public async executeSql(sql: string, params: any[]): Promise<ResultSet> {
    return await RnSqlite.executeSql(this.uid, sql, params);
  }

  public async runInTransaction(runnable: () => void) {
    try {
      await RnSqlite.beginTransaction(this.uid);
      await runnable();
      await RnSqlite.commitTransaction(this.uid);
    } catch (e) {
      await RnSqlite.rollbackTransaction(this.uid);
    }
  }

  public async close(): Promise<any> {
    return await RnSqlite.closeDatabase(this.uid);
  }
}
