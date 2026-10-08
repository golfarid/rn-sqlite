import { SQLiteModule, type SqliteConnection } from 'rn-sqlite';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message?: string;
  durationMs: number;
}

interface TestCase {
  name: string;
  run: () => Promise<void>;
}

const DB_NAME = 'rn-sqlite-tests.sqlite';
const OTHER_DB_NAME = 'rn-sqlite-tests-other.sqlite';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  assert(
    actual === expected,
    `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
  );
}

async function assertRejects(promise: Promise<unknown>, label: string) {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  throw new Error(`${label}: expected a rejection`);
}

const open = () => SQLiteModule.openDatabase(DB_NAME);

async function count(db: SqliteConnection, where = '1'): Promise<number> {
  const result = await db.executeSql(
    `SELECT COUNT(*) AS total FROM kv WHERE ${where}`,
    []
  );
  return result.rows[0].total;
}

const tests: TestCase[] = [
  {
    name: 'openDatabase returns a connection and is idempotent',
    run: async () => {
      const db = await open();
      assertEqual(typeof db.executeSql, 'function', 'executeSql');
      assertEqual(typeof db.runInTransaction, 'function', 'runInTransaction');
      assertEqual(typeof db.close, 'function', 'close');
      const again = await open();
      assertEqual(typeof again.executeSql, 'function', 'second open');
    },
  },
  {
    name: 'executeSql creates a table and reports last_insert_row_id',
    run: async () => {
      const db = await open();
      await db.executeSql('DROP TABLE IF EXISTS kv', []);
      await db.executeSql(
        'CREATE TABLE kv (' +
          'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
          'text_field TEXT, int_field INTEGER, real_field REAL, ' +
          'bool_field INTEGER, null_field TEXT, date_field INTEGER, tag TEXT)',
        []
      );
      const result = await db.executeSql(
        'INSERT INTO kv (text_field, tag) VALUES (?, ?)',
        ['first', 'seed']
      );
      assertEqual(result.rows.length, 0, 'rows of INSERT');
      assertEqual(typeof result.last_insert_row_id, 'number', 'row id type');
      assert(result.last_insert_row_id! > 0, 'row id is positive');
    },
  },
  {
    name: 'parameters are escaped and keep their types on round trip',
    run: async () => {
      const db = await open();
      const text = 'O\'Reilly \\ "quoted" ünïcødé\nline two';
      const date = new Date(1600214400000);
      const inserted = await db.executeSql(
        'INSERT INTO kv (text_field, int_field, real_field, bool_field, null_field, date_field, tag) ' +
          'VALUES (?, ?, ?, ?, ?, ?, ?)',
        [text, 42, 3.5, true, null, date, 'types']
      );
      const result = await db.executeSql('SELECT * FROM kv WHERE id = ?', [
        inserted.last_insert_row_id,
      ]);
      assertEqual(result.rows.length, 1, 'row count');
      const row = result.rows[0];
      assertEqual(row.text_field, text, 'text');
      assertEqual(row.int_field, 42, 'integer');
      assertEqual(row.real_field, 3.5, 'real');
      assertEqual(row.bool_field, 1, 'boolean stored as 1');
      assertEqual(row.null_field, null, 'null');
      assertEqual(row.date_field, 1600214400000, 'date as milliseconds');
    },
  },
  {
    name: '?? placeholders escape identifiers',
    run: async () => {
      const db = await open();
      const result = await db.executeSql('SELECT ?? FROM ?? WHERE tag = ?', [
        'text_field',
        'kv',
        'seed',
      ]);
      assertEqual(result.rows.length, 1, 'row count');
      assertEqual(result.rows[0].text_field, 'first', 'selected column');
    },
  },
  {
    name: 'UPDATE and DELETE change rows',
    run: async () => {
      const db = await open();
      await db.executeSql('UPDATE kv SET text_field = ? WHERE tag = ?', [
        'updated',
        'seed',
      ]);
      const after = await db.executeSql(
        'SELECT text_field FROM kv WHERE tag = ?',
        ['seed']
      );
      assertEqual(after.rows[0].text_field, 'updated', 'updated value');
      await db.executeSql('DELETE FROM kv WHERE tag = ?', ['seed']);
      assertEqual(await count(db, "tag = 'seed'"), 0, 'rows left');
    },
  },
  {
    name: 'runInTransaction commits when the callback succeeds',
    run: async () => {
      const db = await open();
      await db.runInTransaction(async () => {
        for (let i = 0; i < 50; i++) {
          await db.executeSql('INSERT INTO kv (int_field, tag) VALUES (?, ?)', [
            i,
            'commit',
          ]);
        }
      });
      assertEqual(await count(db, "tag = 'commit'"), 50, 'committed rows');
    },
  },
  {
    name: 'runInTransaction rolls back when the callback throws',
    run: async () => {
      const db = await open();
      const before = await count(db);
      const error = await assertRejects(
        db.runInTransaction(async () => {
          await db.executeSql('INSERT INTO kv (tag) VALUES (?)', ['rollback']);
          await db.executeSql('INSERT INTO kv (tag) VALUES (?)', ['rollback']);
          throw new Error('boom');
        }),
        'transaction'
      );
      assert(
        error instanceof Error && error.message === 'boom',
        'original error is rethrown'
      );
      assertEqual(await count(db), before, 'row count unchanged');
      assertEqual(
        await count(db, "tag = 'rollback'"),
        0,
        'no rolled back rows'
      );
    },
  },
  {
    name: 'concurrent transactions run one after another',
    run: async () => {
      const db = await open();
      const events: string[] = [];
      const work = (tag: string) =>
        db.runInTransaction(async () => {
          events.push(`${tag}:start`);
          for (let i = 0; i < 20; i++) {
            await db.executeSql(
              'INSERT INTO kv (int_field, tag) VALUES (?, ?)',
              [i, tag]
            );
          }
          events.push(`${tag}:end`);
        });
      await Promise.all([work('a'), work('b')]);
      assertEqual(await count(db, "tag = 'a'"), 20, 'rows from a');
      assertEqual(await count(db, "tag = 'b'"), 20, 'rows from b');
      const serialized =
        events.join(',') === 'a:start,a:end,b:start,b:end' ||
        events.join(',') === 'b:start,b:end,a:start,a:end';
      assert(serialized, `transactions overlapped: ${events.join(',')}`);
    },
  },
  {
    name: 'invalid SQL rejects and the connection stays usable',
    run: async () => {
      const db = await open();
      const error = await assertRejects(
        db.executeSql('SELECT * FROM no_such_table', []),
        'invalid statement'
      );
      assert(error instanceof Error, 'rejects with an Error');
      assert(
        error.message.includes('no_such_table'),
        `message mentions the table: ${error.message}`
      );
      const result = await db.executeSql('SELECT 1 AS one', []);
      assertEqual(result.rows[0].one, 1, 'connection still works');
    },
  },
  {
    name: 'a failing statement inside a transaction rolls it back',
    run: async () => {
      const db = await open();
      const before = await count(db);
      await assertRejects(
        db.runInTransaction(async () => {
          await db.executeSql('INSERT INTO kv (tag) VALUES (?)', ['broken']);
          await db.executeSql('INSERT INTO no_such_table VALUES (1)', []);
        }),
        'transaction with a bad statement'
      );
      assertEqual(await count(db), before, 'row count unchanged');
      assertEqual(await count(db, "tag = 'broken'"), 0, 'no partial rows');
    },
  },
  {
    name: 'data persists across close and reopen',
    run: async () => {
      const db = await open();
      await db.executeSql('INSERT INTO kv (text_field, tag) VALUES (?, ?)', [
        'still here',
        'persist',
      ]);
      await db.close();
      const reopened = await open();
      const result = await reopened.executeSql(
        'SELECT text_field FROM kv WHERE tag = ?',
        ['persist']
      );
      assertEqual(result.rows.length, 1, 'row count after reopen');
      assertEqual(result.rows[0].text_field, 'still here', 'value');
    },
  },
  {
    name: 'separate databases are isolated',
    run: async () => {
      const other = await SQLiteModule.openDatabase(OTHER_DB_NAME);
      await other.executeSql('DROP TABLE IF EXISTS only_here', []);
      await other.executeSql('CREATE TABLE only_here (x INTEGER)', []);
      await other.executeSql('INSERT INTO only_here (x) VALUES (?)', [1]);
      const inOther = await other.executeSql(
        'SELECT COUNT(*) AS total FROM only_here',
        []
      );
      assertEqual(inOther.rows[0].total, 1, 'rows in other db');
      const db = await open();
      const inMain = await db.executeSql(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        ['only_here']
      );
      assertEqual(inMain.rows.length, 0, 'table absent in main db');
      await other.close();
    },
  },
];

export async function runTests(
  onResult: (result: TestResult) => void
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  for (const test of tests) {
    const started = Date.now();
    let result: TestResult;
    try {
      await test.run();
      result = {
        name: test.name,
        status: 'pass',
        durationMs: Date.now() - started,
      };
    } catch (e) {
      result = {
        name: test.name,
        status: 'fail',
        message: e instanceof Error ? e.message : String(e),
        durationMs: Date.now() - started,
      };
    }
    results.push(result);
    onResult(result);
  }
  return results;
}
