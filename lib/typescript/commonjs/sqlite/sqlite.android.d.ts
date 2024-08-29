import { type ResultSet } from './result.set';
import { type SqliteConnection } from './sqlite.connection';
export declare class SQLite implements SqliteConnection {
    private readonly sessionId;
    private readonly name;
    constructor(name: String, sessionId: number);
    executeSql(sql: string, params: any[]): Promise<ResultSet>;
    runInTransaction(runnable: () => void): Promise<void>;
    close(): Promise<void>;
}
//# sourceMappingURL=sqlite.android.d.ts.map