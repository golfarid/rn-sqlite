import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SQLiteModule } from 'rn-sqlite';
import { SqliteConnection } from 'rn-sqlite';

export default function App() {
  const [insertResult, setInsertResult] = React.useState<string | undefined>();
  const [selectResult, setSelectResult] = React.useState<string | undefined>();

  const dbTest = async (connection: SqliteConnection) => {
    setInsertResult('Inserting...');
    let start = new Date().getTime();
    await connection.runInTransaction(async () => {
      await connection.executeSql(
        'CREATE TABLE IF NOT EXISTS test (\n\tid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \n\tbigint_field BIGINT NOT NULL, ' +
          '\n\tstring_field VARCHAR NOT NULL, \n\tdouble_field FLOAT NOT NULL, \n\tnull_field VARCHAR\n)',
        []
      );

      await connection.executeSql('DELETE FROM test WHERE 1', []);

      for (let i = 0; i < 100; i++) {
        const resultSet = await connection.executeSql(
          'INSERT INTO test (bigint_field, string_field, double_field, null_field) VALUES (?, ?, ?, ?)',
          [new Date(), `Some \? string ${i}`, i * 1.1, null]
        );
        console.log(resultSet);
      }
    });

    const resultSet = await connection.executeSql(
      'INSERT INTO test (bigint_field, string_field, double_field, null_field) VALUES (?, ?, ?, ?)',
      [1600214400000, `Some \? string ${100}`, 100 * 1.1, null]
    );
    console.log(resultSet);

    setInsertResult(`Insert finished in ${new Date().getTime() - start}`);

    start = new Date().getTime();
    await connection.runInTransaction(async () => {
      const resultSet = await connection.executeSql(
        'SELECT id, bigint_field, string_field, double_field, null_field FROM test',
        []
      );

      console.table(resultSet.rows);
    });

    // await SQLite.close();
    setSelectResult(`Select finished in ${new Date().getTime() - start}`);
  };

  React.useEffect(() => {
    SQLiteModule.openDatabase('test.sqlite').then(
      (connection: SqliteConnection) => {
        dbTest(connection)
          .then(() => console.log('query one ok'))
          .catch(console.error);
        dbTest(connection)
          .then(() => console.log('query two ok'))
          .catch(console.error);
      }
    );

    return () => {
      SQLiteModule.openDatabase('test.sqlite').then(
        async (connection: SqliteConnection) => {
          await connection.close();
        }
      );
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>Insert result: {insertResult}</Text>
      <Text>Select result: {selectResult}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
