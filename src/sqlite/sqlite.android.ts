import { ResultSet } from './result.set';

const { RnSqlite } = NativeModules;

import { NativeModules } from 'react-native';
import {
  delay,
  SqliteConnection,
  TRANSACTION_CHECK_INTERVAL,
  TRANSACTION_WAIT_TIMEOUT,
} from './sqlite.connection';

export class SQLite implements SqliteConnection {
  private readonly sessionId: number;
  private readonly name: String;
  constructor(name: String, sessionId: number) {
    this.name = name;
    this.sessionId = sessionId;
  }

  public async executeSql(sql: string, params: any[]): Promise<ResultSet> {
    console.debug(`${this.sessionId}: Execute ${sql} with ${params}`);
    return await RnSqlite.executeSql(this.name, sql, params);
  }

  public async runInTransaction(runnable: () => void): Promise<void> {
    let timestamp = new Date();
    do {
      if ((await RnSqlite.beginTransaction(this.name)) !== 'BUSY') {
        console.debug(`${this.sessionId}: Transaction started`);
        try {
          await runnable();
          console.debug(`${this.sessionId}: Commit transaction`);
          await RnSqlite.commitTransaction(this.name);
        } catch (e) {
          console.debug(`${this.sessionId}: Transaction failed with ${e}`);
          throw e;
        } finally {
          await RnSqlite.endTransaction(this.name);
          console.debug(`${this.sessionId}: End transaction`);
        }

        return;
      } else {
        console.debug(`${this.sessionId}: Already in transaction... wait`);
        await delay(TRANSACTION_CHECK_INTERVAL);
      }
    } while (
      new Date().getTime() - timestamp.getTime() <
      TRANSACTION_WAIT_TIMEOUT
    );

    throw new Error('Already in transaction');
  }

  public async close(): Promise<void> {
    return await RnSqlite.closeDatabase(this.name);
  }
}
