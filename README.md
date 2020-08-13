# rn-sqlite

Simple react-native wrapper around native sqlite  with transaction support

## Installation

```sh
npm install rn-sqlite https://github.com/golfarid/rn-sqlite.git
```

## Usage

```js
import RnSqlite from "rn-sqlite";

// ...

const SQLite = await SQLiteModule.openDatabase(
    Platform.OS === 'ios' ? '/tmp/test.sqlite' : 'test.sqlite'
);

await SQLite.runInTransaction(async () => {
    await SQLite.executeSql(
        'CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, bigint_field BIGINT NOT NULL, string_field VARCHAR NOT NULL, int_field INTEGER)',
        []
    );

    await SQLite.executeSql('DELETE FROM test WHERE 1', []);

    for (let i = 0; i < 10000; i++) {
        await SQLite.executeSql(
            'INSERT INTO test (bigint_field, string_field, int_field) VALUES (?, ?, ?)',
            [i, `Test string ${i}`, i]
        );
    }
});
    
await SQLite.runInTransaction(async () => {
    await SQLite.executeSql(
        'SELECT id, bigint_field, string_field, int_field FROM test',
        []
    );
});

await SQLite.close();

// ...

```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
