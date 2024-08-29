"use strict";

const {
  RnSqlite
} = NativeModules;
import { NativeModules } from 'react-native';
import { delay, TRANSACTION_CHECK_INTERVAL, TRANSACTION_WAIT_TIMEOUT } from "./sqlite.connection.js";
import SqlString from 'sqlstring';
export class SQLite {
  constructor(name, sessionId) {
    this.name = name;
    this.sessionId = sessionId;
  }
  async executeSql(sql, params) {
    if (__DEV__) {
      console.debug(`${this.sessionId}: Execute ${sql} with ${params}`);
    }
    return await RnSqlite.executeSql(this.name, SqlString.format(sql, params));
  }
  async runInTransaction(runnable) {
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
          await RnSqlite.rollbackTransaction(this.name);
          if (__DEV__) {
            console.debug(`${this.sessionId}: Rollback transaction`);
          }
          throw e;
        }
        return;
      } else {
        if (__DEV__) {
          console.debug(`${this.sessionId}: Already in transaction... wait`);
        }
        if (new Date().getTime() - timestamp.getTime() < TRANSACTION_WAIT_TIMEOUT) {
          await delay(TRANSACTION_CHECK_INTERVAL);
        } else {
          // rollback current transaction
          await RnSqlite.rollbackTransaction(this.name);
        }
      }
    } while (true);
  }
  async close() {
    if (__DEV__) {
      console.debug(`${this.sessionId}: Close database`);
    }
    return await RnSqlite.closeDatabase(this.name);
  }
}
//# sourceMappingURL=sqlite.js.map