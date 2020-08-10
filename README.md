# rn-sqlite

&#39;Simple sqlite native wrapper&#39;

## Installation

```sh
npm install rn-sqlite https://github.com/golfarid/rn-sqlite.git
```

## Usage

```js
import RnSqlite from "rn-sqlite";

// ...
const SQLite = await SQLiteModule.openDatabase('test');
  await SQLite.runInTransaction(async () => {
    const firstResultSet = await SQLite.executeSql(
      "SELECT 1 as 'a', 'b' as 'b', ? as 'c', ? as 'd'",
      [true, 'some text']
    );

    const secondResultSet = await SQLite.executeSql(
      'CREATE TABLE IF NOT EXISTS test_table (\n\tid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \n\tdate BIGINT NOT NULL, \n\tguid VARCHAR NOT NULL, \n\tsome_num INTEGER, \n\tanother_some_num INTEGER\n)',
      []
    );

    const thirdResultSet = await SQLite.executeSql(
      'INSERT INTO test_table (date, guid, some_num, another_some_num) VALUES (?, ?, ?, ?)',
      [1, '1', 1, 1]
    );

    const fourthResultSet = await SQLite.executeSql(
      'INSERT INTO test_table (date, guid, some_num, another_some_num) VALUES (?, ?, ?, ?)',
      [2, '2', 2, 2]
    );

  });

  await SQLite.close();
};

// ...

```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT
