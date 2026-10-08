import { format } from '../sqlite/sqlstring';

describe('format', () => {
  it('returns sql untouched without values', () => {
    expect(format('SELECT 1', [])).toBe('SELECT 1');
    expect(format('SELECT ?', null)).toBe('SELECT ?');
  });

  it('escapes strings by doubling single quotes', () => {
    expect(format('SELECT ?', ["it's"])).toBe("SELECT 'it''s'");
    expect(format('SELECT ?', ['a\\b'])).toBe("SELECT 'a\\\\b'");
    expect(format('SELECT ?', ['line\nbreak "quoted"'])).toBe(
      'SELECT \'line\nbreak "quoted"\''
    );
  });

  it('formats numbers, booleans and null', () => {
    expect(
      format('VALUES (?, ?, ?, ?, ?)', [1.5, true, false, null, undefined])
    ).toBe('VALUES (1.5, 1, 0, NULL, NULL)');
  });

  it('formats dates as millisecond timestamps', () => {
    expect(format('SELECT ?', [new Date(1600214400000)])).toBe(
      'SELECT 1600214400000'
    );
  });

  it('escapes identifiers for ??', () => {
    expect(format('SELECT ?? FROM ??', ['a.b', 'ta`ble'])).toBe(
      'SELECT `a`.`b` FROM `ta``ble`'
    );
    expect(format('SELECT ??', [['a', 'b']])).toBe('SELECT `a`, `b`');
  });

  it('skips runs of three or more question marks', () => {
    expect(format('SELECT ???, ?', [1])).toBe('SELECT ???, 1');
  });

  it('leaves extra placeholders when values run out', () => {
    expect(format('SELECT ?, ?', [1])).toBe('SELECT 1, ?');
  });

  it('expands objects to key = value pairs', () => {
    expect(format('SET ?', [{ a: 1, b: "x'y", c: () => 1 }])).toBe(
      "SET `a` = 1, `b` = 'x''y'"
    );
  });

  it('uses toSqlString for raw values', () => {
    expect(format('SELECT ?', [{ toSqlString: () => 'NOW()' }])).toBe(
      'SELECT NOW()'
    );
  });
});
