import { NativeModules } from 'react-native';

type RnSqliteType = {
  multiply(a: number, b: number): Promise<number>;
};

const { RnSqlite } = NativeModules;

export default RnSqlite as RnSqliteType;
