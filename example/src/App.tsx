import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SQLiteModule } from 'rn-sqlite';

export default function App() {
  const [result, setResult] = React.useState<string | undefined>();

  const dbTest = async () => {
    const SQLite = await SQLiteModule.openDatabase('test');
    await SQLite.runInTransaction(async () => {
      let queryLog: string;
      const rs = await SQLite.executeSql(
        "SELECT 1 as 'a', 'b' as 'b', ? as 'c', ? as 'd'",
        [true, 'dwqw\\dqwd']
      );
      queryLog = JSON.stringify(rs);

      const rs1 = await SQLite.executeSql(
        'CREATE TABLE IF NOT EXISTS routes (\n\tid INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, \n\tdate BIGINT NOT NULL, \n\tguid VARCHAR NOT NULL, \n\tbegin_check_in_id INTEGER, \n\tend_check_in_id INTEGER\n)',
        []
      );
      queryLog += '\n' + JSON.stringify(rs1);

      const rs2 = await SQLite.executeSql(
        'INSERT INTO routes (date, guid, begin_check_in_id, end_check_in_id) VALUES (?, ?, ?, ?)',
        [1, '1', 1, 1]
      );
      queryLog += '\n' + JSON.stringify(rs2);

      const rs3 = await SQLite.executeSql(
        'INSERT INTO routes (date, guid, begin_check_in_id, end_check_in_id) VALUES (?, ?, ?, ?)',
        [2, '2', 2, 2]
      );
      queryLog += '\n' + JSON.stringify(rs3);
      setResult(queryLog);
    });
    await SQLite.close();
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
