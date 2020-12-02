package com.rnsqlite

object DatabaseUtils {
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
