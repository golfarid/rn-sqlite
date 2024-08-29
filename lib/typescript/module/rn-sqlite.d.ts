import { type SqliteConnection } from './sqlite/sqlite.connection';
export declare class SQLiteModule {
    private static sessionId;
    static openDatabase(name: string): Promise<SqliteConnection>;
}
//# sourceMappingURL=rn-sqlite.d.ts.map