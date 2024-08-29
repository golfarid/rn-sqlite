"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SQLite = void 0;
var _reactNative = require("react-native");
var _sqliteConnection = require("./sqlite.connection.js");
var _sqlstring = _interopRequireDefault(require("sqlstring"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const {
  RnSqlite
} = _reactNative.NativeModules;
class SQLite {
  constructor(name, sessionId) {
    this.name = name;
    this.sessionId = sessionId;
  }
  async executeSql(sql, params) {
    if (__DEV__) {
      console.debug(`${this.sessionId}: Execute ${sql} with ${params}`);
    }
    return await RnSqlite.executeSql(this.name, _sqlstring.default.format(sql, params));
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
        if (new Date().getTime() - timestamp.getTime() < _sqliteConnection.TRANSACTION_WAIT_TIMEOUT) {
          await (0, _sqliteConnection.delay)(_sqliteConnection.TRANSACTION_CHECK_INTERVAL);
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
exports.SQLite = SQLite;
//# sourceMappingURL=sqlite.js.map