import { NativeModules } from 'react-native';
import { SQLite } from './sqlite/sqlite';
import type { SqliteConnection } from './sqlite/sqlite.connection';

const { RnSqlite } = NativeModules;

export class SQLiteModule {
  public static async openDatabase(name: string): Promise<SqliteConnection> {
    let uid = await RnSqlite.openDatabase(name);
    return new SQLite(uid);
  }
}
