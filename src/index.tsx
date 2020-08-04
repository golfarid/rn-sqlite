import { NativeModules } from 'react-native';
import { SQLite } from './sqlite/sqlite';

const { RnSqlite } = NativeModules;

export class SQLiteModule {
  public static async openDatabase(name: string) {
    await RnSqlite.openDatabase(name);
    return new SQLite();
  }
}
