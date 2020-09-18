import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SQLiteModule } from 'rn-sqlite';

export default function App() {
  const [result, setResult] = React.useState<string | undefined>();

  const dbTest = async () => {
    setResult('Inserting...');
    const SQLite = await SQLiteModule.openDatabase('test.sqlite');
    await SQLite.runInTransaction(async () => {
      // console.time('insert');
      await SQLite.executeSql(
        'CREATE TABLE IF NOT EXISTS test (\n\tid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \n\tbigint_field BIGINT NOT NULL, ' +
          '\n\tstring_field VARCHAR NOT NULL, \n\tdouble_field FLOAT NOT NULL, \n\tnull_field VARCHAR\n)',
        []
      );

      await SQLite.executeSql('DELETE FROM test WHERE 1', []);

      for (let i = 0; i < 100; i++) {
        await SQLite.executeSql(
          'INSERT INTO test (bigint_field, string_field, double_field, null_field) VALUES (?, ?, ?, ?)',
          [1600214400000, `Some \? string ${i}`, i * 1.1, null]
        );
      }
      // console.timeEnd('insert');
    });

    setResult('Insert finished');

    await SQLite.runInTransaction(async () => {
      // console.time('select');
      const resultSet = await SQLite.executeSql(
        'SELECT id, bigint_field, string_field, double_field, null_field FROM test',
        []
      );

      console.table(resultSet.rows);
    });

    await SQLite.close();
    setResult('Query finished');
  };

  React.useEffect(() => {
    dbTest()
      .then(() => console.info('query ok'))
      .catch(console.error);
  }, []);

  return (
    <View style={styles.container}>
      <Text>Result: {result}</Text>
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
