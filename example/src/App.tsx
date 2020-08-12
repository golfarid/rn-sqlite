import * as React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { SQLiteModule } from 'rn-sqlite';

export default function App() {
  const [result, setResult] = React.useState<string | undefined>();

  const dbTest = async () => {
    setResult('Inserting...');
    const SQLite = await SQLiteModule.openDatabase(
      Platform.OS === 'ios' ? '/tmp/test.sqlite' : 'test.sqlite'
    );
    await SQLite.runInTransaction(async () => {
      // console.time('insert');
      await SQLite.executeSql(
        'CREATE TABLE IF NOT EXISTS test (\n\tid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \n\tbigint_field BIGINT NOT NULL, \n\tstring_field VARCHAR NOT NULL, \n\tint_field INTEGER\n)',
        []
      );

      await SQLite.executeSql('DELETE FROM test WHERE 1', []);

      for (let i = 0; i < 10000; i++) {
        await SQLite.executeSql(
          'INSERT INTO test (bigint_field, string_field, int_field) VALUES (?, ?, ?)',
          [i, `Some string ${i}`, i]
        );
      }
      // console.timeEnd('insert');
    });

    setResult('Insert finished');

    await SQLite.runInTransaction(async () => {
      // console.time('select');
      await SQLite.executeSql(
        'SELECT id, bigint_field, string_field, int_field FROM test',
        []
      );

      // console.timeEnd('select');
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
