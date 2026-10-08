"use strict";

/**
 * SQL value escaping and `?` placeholder formatting for SQLite.
 *
 * Vendored from https://github.com/golfarid/sqlstring, a fork of
 * https://github.com/mysqljs/sqlstring (MIT, Felix Geisendörfer and
 * contributors) adjusted for SQLite: single quotes are escaped by doubling,
 * booleans become 1/0 and Dates become millisecond timestamps.
 */

const ID_GLOBAL_REGEXP = /`/g;
const QUAL_GLOBAL_REGEXP = /\./g;
const CHARS_GLOBAL_REGEXP = /[\x1a'\\]/g; // eslint-disable-line no-control-regex
const CHARS_ESCAPE_MAP = {
  '\x1a': '\\Z',
  "'": "''",
  '\\': '\\\\'
};

/**
 * Replaces `?` placeholders with escaped values and `??` placeholders with
 * escaped identifiers. Runs of three or more `?` are left untouched.
 */
export function format(sql, values) {
  if (values == null) {
    return sql;
  }
  let chunkIndex = 0;
  const placeholdersRegex = /\?+/g;
  let result = '';
  let valuesIndex = 0;
  let match;
  while (valuesIndex < values.length && (match = placeholdersRegex.exec(sql))) {
    const len = match[0].length;
    if (len > 2) {
      continue;
    }
    const value = len === 2 ? escapeId(values[valuesIndex]) : escape(values[valuesIndex], false);
    result += sql.slice(chunkIndex, match.index) + value;
    chunkIndex = placeholdersRegex.lastIndex;
    valuesIndex++;
  }
  if (chunkIndex === 0) {
    // Nothing was replaced
    return sql;
  }
  if (chunkIndex < sql.length) {
    return result + sql.slice(chunkIndex);
  }
  return result;
}
function escapeId(val, forbidQualified) {
  if (Array.isArray(val)) {
    return val.map(v => escapeId(v, forbidQualified)).join(', ');
  }
  const id = String(val).replace(ID_GLOBAL_REGEXP, '``');
  return forbidQualified ? '`' + id + '`' : '`' + id.replace(QUAL_GLOBAL_REGEXP, '`.`') + '`';
}
function escape(val, stringifyObjects) {
  if (val === undefined || val === null) {
    return 'NULL';
  }
  switch (typeof val) {
    case 'boolean':
      return val ? '1' : '0';
    case 'number':
      return String(val);
    case 'object':
      if (val instanceof Date) {
        return String(val.getTime());
      } else if (typeof val.toSqlString === 'function') {
        return String(val.toSqlString());
      } else if (stringifyObjects) {
        return escapeString(String(val));
      } else {
        return objectToValues(val);
      }
    default:
      return escapeString(String(val));
  }
}
function objectToValues(object) {
  let sql = '';
  for (const key in object) {
    const val = object[key];
    if (typeof val === 'function') {
      continue;
    }
    sql += (sql.length === 0 ? '' : ', ') + escapeId(key) + ' = ' + escape(val, true);
  }
  return sql;
}
function escapeString(val) {
  let chunkIndex = CHARS_GLOBAL_REGEXP.lastIndex = 0;
  let escapedVal = '';
  let match;
  while (match = CHARS_GLOBAL_REGEXP.exec(val)) {
    escapedVal += val.slice(chunkIndex, match.index) + CHARS_ESCAPE_MAP[match[0]];
    chunkIndex = CHARS_GLOBAL_REGEXP.lastIndex;
  }
  if (chunkIndex === 0) {
    // Nothing was escaped
    return "'" + val + "'";
  }
  if (chunkIndex < val.length) {
    return "'" + escapedVal + val.slice(chunkIndex) + "'";
  }
  return "'" + escapedVal + "'";
}
//# sourceMappingURL=sqlstring.js.map