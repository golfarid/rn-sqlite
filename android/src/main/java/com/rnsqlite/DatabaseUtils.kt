package com.rnsqlite

object DatabaseUtils {
  fun objectToSqlString(value: Any?): String {
    return if (value == null) {
      "NULL";
    } else if (value is Double || value is Float) {
      value.toString()
    } else if (value is Number) {
      value.toString()
    } else if (value is Boolean) {
      if (value) "1" else "0"
    } else if (value is ByteArray) {
      String(value, Charsets.UTF_8)
    } else {
      value.toString()
    }
  }

  fun escapeString(str: String): String {
    val strBuilder = StringBuilder()
    appendEscapedSQLString(strBuilder, str)
    return strBuilder.toString()
  }

  private fun appendEscapedSQLString(sb: StringBuilder, sqlString: String) {
    sb.append('\'')
    if (sqlString.indexOf('\'') != -1) {
      val length = sqlString.length
      for (i in 0 until length) {
        val c = sqlString[i]
        if (c == '\'') {
          sb.append('\'')
        }
        sb.append(c)
      }
    } else sb.append(sqlString)
    sb.append('\'')
  }
}
