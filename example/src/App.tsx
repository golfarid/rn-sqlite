import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SQLiteModule } from 'rn-sqlite';

export default function App() {
  const [result, setResult] = React.useState<string | undefined>();

  const dbTest = async () => {
    const SQLite = await SQLiteModule.openDatabase('test');
    await SQLite.runInTransaction(async () => {
      const rs = await SQLite.executeSql(
        "SELECT 1 as 'a', 'b' as 'b', ? as 'c', ? as 'd'",
        [true, 'dwqw\\dqwd']
      );
      setResult(JSON.stringify(rs));
    });
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
