"use strict";

import { NativeModules } from 'react-native';
import { SQLite } from './sqlite/sqlite';
const {
  RnSqlite
} = NativeModules;
export class SQLiteModule {
  static sessionId = 0;
  static async openDatabase(name) {
    let openedName = await RnSqlite.openDatabase(name);
    return new SQLite(openedName, ++SQLiteModule.sessionId);
  }
}
//# sourceMappingURL=rn-sqlite.js.map