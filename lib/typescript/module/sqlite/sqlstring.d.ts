/**
 * SQL value escaping and `?` placeholder formatting for SQLite.
 *
 * Vendored from https://github.com/golfarid/sqlstring, a fork of
 * https://github.com/mysqljs/sqlstring (MIT, Felix Geisendörfer and
 * contributors) adjusted for SQLite: single quotes are escaped by doubling,
 * booleans become 1/0 and Dates become millisecond timestamps.
 */
/**
 * Replaces `?` placeholders with escaped values and `??` placeholders with
 * escaped identifiers. Runs of three or more `?` are left untouched.
 */
export declare function format(sql: string, values: unknown[] | null | undefined): string;
//# sourceMappingURL=sqlstring.d.ts.map