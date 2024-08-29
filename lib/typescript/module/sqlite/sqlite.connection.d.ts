import { type ResultSet } from './result.set';
export declare const TRANSACTION_WAIT_TIMEOUT = 30000;
export declare const TRANSACTION_CHECK_INTERVAL = 100;
export declare const delay: (millis: number) => Promise<unknown>;
export interface SqliteConnection {
    executeSql(sql: string, params: any[]): Promise<ResultSet>;
    runInTransaction(runnable: () => void): Promise<void>;
    close(): Promise<void>;
}
//# sourceMappingURL=sqlite.connection.d.ts.map