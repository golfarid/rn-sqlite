import { NativeModules } from 'react-native';
import { SQLite } from './sqlite/sqlite';
import { type SqliteConnection } from './sqlite/sqlite.connection';

const { RnSqlite } = NativeModules;

export class SQLiteModule {
  private static sessionId: number = 0;
  public static async openDatabase(name: string): Promise<SqliteConnection> {
    let openedName = await RnSqlite.openDatabase(name);
    return new SQLite(openedName, ++SQLiteModule.sessionId);
  }
}
