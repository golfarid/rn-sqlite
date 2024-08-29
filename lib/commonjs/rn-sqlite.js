"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SQLiteModule = void 0;
var _reactNative = require("react-native");
var _sqlite = require("./sqlite/sqlite");
const {
  RnSqlite
} = _reactNative.NativeModules;
class SQLiteModule {
  static sessionId = 0;
  static async openDatabase(name) {
    let openedName = await RnSqlite.openDatabase(name);
    return new _sqlite.SQLite(openedName, ++SQLiteModule.sessionId);
  }
}
exports.SQLiteModule = SQLiteModule;
//# sourceMappingURL=rn-sqlite.js.map