import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { runTests, type TestResult } from './tests';

export default function App() {
  const [results, setResults] = React.useState<TestResult[]>([]);
  const [finished, setFinished] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    runTests((result) => {
      if (cancelled) {
        return;
      }
      setResults((previous) => [...previous, result]);
      console.log(
        `[rn-sqlite-test] ${result.status.toUpperCase()} ${result.name}` +
          (result.message ? `: ${result.message}` : '')
      );
    }).then((all) => {
      if (cancelled) {
        return;
      }
      setFinished(true);
      const failed = all.filter((r) => r.status === 'fail').length;
      console.log(
        `[rn-sqlite-test] DONE ${all.length - failed}/${all.length} passed`
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const failed = results.filter((r) => r.status === 'fail').length;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.summary}>
        {finished ? 'Finished' : 'Running…'} {results.length - failed}/
        {results.length} passed
      </Text>
      {results.map((result) => (
        <View key={result.name} style={styles.row}>
          <Text style={result.status === 'pass' ? styles.pass : styles.fail}>
            {result.status === 'pass' ? '✓' : '✗'} {result.name} (
            {result.durationMs} ms)
          </Text>
          {result.message ? (
            <Text style={styles.message}>{result.message}</Text>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 72,
  },
  summary: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    marginBottom: 8,
  },
  pass: {
    color: 'green',
  },
  fail: {
    color: 'red',
  },
  message: {
    color: 'gray',
    marginLeft: 16,
  },
});
