import { ResultSet } from './result.set';

const { RnSqlite } = NativeModules;
import { NativeModules } from 'react-native';
import {
  delay,
  SqliteConnection,
  TRANSACTION_CHECK_INTERVAL,
  TRANSACTION_WAIT_TIMEOUT,
} from './sqlite.connection';
import SqlString from 'sqlstring';

export class SQLite implements SqliteConnection {
  private readonly name: String;
  private readonly sessionId: number;
  constructor(name: String, sessionId: number) {
    this.name = name;
    this.sessionId = sessionId;
  }

  public async executeSql(sql: string, params: any[]): Promise<ResultSet> {
    console.debug(`${this.sessionId}: Execute ${sql} with ${params}`);
    return await RnSqlite.executeSql(this.name, SqlString.format(sql, params));
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
          await RnSqlite.rollbackTransaction(this.name);
          console.debug(`${this.sessionId}: Rollback transaction`);
          throw e;
        }

        return;
      } else {
        console.debug(`${this.sessionId}: Already in transaction... wait`);
        if (
          new Date().getTime() - timestamp.getTime() <
          TRANSACTION_WAIT_TIMEOUT
        ) {
          await delay(TRANSACTION_CHECK_INTERVAL);
        } else {
          // rollback current transaction
          await RnSqlite.rollbackTransaction(this.name);
        }
      }
    } while (true);
  }

  public async close(): Promise<void> {
    console.debug(`${this.sessionId}: Close database`);
    return await RnSqlite.closeDatabase(this.name);
  }
}
