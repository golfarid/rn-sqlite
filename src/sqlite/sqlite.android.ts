import { type ResultSet } from './result.set';

const { RnSqlite } = NativeModules;

import { NativeModules } from 'react-native';
import {
  delay,
  type SqliteConnection,
  TRANSACTION_CHECK_INTERVAL,
  TRANSACTION_WAIT_TIMEOUT,
} from './sqlite.connection';
import SqlString from 'sqlstring';

export class SQLite implements SqliteConnection {
  private readonly sessionId: number;
  private readonly name: String;
  constructor(name: String, sessionId: number) {
    this.name = name;
    this.sessionId = sessionId;
  }

  public async executeSql(sql: string, params: any[]): Promise<ResultSet> {
    if (__DEV__) {
      console.debug(`${this.sessionId}: Execute ${sql} with ${params}`);
    }

    const json = await RnSqlite.executeSql(
      this.name,
      SqlString.format(sql, params)
    );

    return JSON.parse(json);
  }

  public async runInTransaction(runnable: () => void): Promise<void> {
    let timestamp = new Date();
    do {
      if ((await RnSqlite.beginTransaction(this.name)) !== 'BUSY') {
        if (__DEV__) {
          console.debug(`${this.sessionId}: Transaction started`);
        }
        try {
          await runnable();
          if (__DEV__) {
            console.debug(`${this.sessionId}: Commit transaction`);
          }
          await RnSqlite.commitTransaction(this.name);
        } catch (e) {
          if (__DEV__) {
            console.debug(`${this.sessionId}: Transaction failed with ${e}`);
          }
          throw e;
        } finally {
          await RnSqlite.endTransaction(this.name);
          if (__DEV__) {
            console.debug(`${this.sessionId}: End transaction`);
          }
        }

        return;
      } else {
        if (__DEV__) {
          console.debug(`${this.sessionId}: Already in transaction... wait`);
        }
        if (
          new Date().getTime() - timestamp.getTime() <
          TRANSACTION_WAIT_TIMEOUT
        ) {
          await delay(TRANSACTION_CHECK_INTERVAL);
        } else {
          // rollback current transaction
          await RnSqlite.endTransaction(this.name);
        }
      }
    } while (true);
  }

  public async close(): Promise<void> {
    return await RnSqlite.closeDatabase(this.name);
  }
}
