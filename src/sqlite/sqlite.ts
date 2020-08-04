const { RnSqlite } = NativeModules;

import { NativeModules } from 'react-native';

export class SQLite {
  public async executeSql(sql: string, params: any[]): Promise<any> {
    return await RnSqlite.executeSql(sql, params);
  }

  public async runInTransaction(runnable: () => void) {
    try {
      await RnSqlite.beginTransaction();
      await runnable();
      await RnSqlite.commitTransaction();
    } catch (e) {
      await RnSqlite.rollbackTransaction();
    }
  }
}
