import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SQLiteModule } from 'rn-sqlite';

export default function App() {
  const [result, setResult] = React.useState<string | undefined>();

  const dbTest = async () => {
    setResult('Inserting...');
    const SQLite = await SQLiteModule.openDatabase('/tmp/test.sqlite');
    await SQLite.runInTransaction(async () => {
      await SQLite.executeSql(
        'CREATE TABLE IF NOT EXISTS test (\n\tid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \n\tbigint_field BIGINT NOT NULL, \n\tstring_field VARCHAR NOT NULL, \n\tint_field INTEGER\n)',
        []
      );

      for (let i = 0; i < 10000; i++) {
        await SQLite.executeSql(
          'INSERT INTO test (bigint_field, string_field, int_field) VALUES (?, ?, ?)',
          [i, `Some string ${i}`, i]
        );
      }
    });

    setResult('Insert finished');

    await SQLite.runInTransaction(async () => {
      const result = await SQLite.executeSql(
        'SELECT id, bigint_field, string_field, int_field FROM test',
        []
      );

      console.log(result);
    });

    await SQLite.close();
    setResult('Query finished');
  };

  React.useEffect(() => {
    // RnSqlite.multiply(3, 7).then(setResult);
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
