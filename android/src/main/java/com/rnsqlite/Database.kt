package com.rnsqlite

import android.content.Context
import android.database.Cursor
import android.database.Cursor.*
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import java.math.BigDecimal

class Database(context: Context, name: String, version: Int) :
  SQLiteOpenHelper(context, name, null, version) {
  private val db: SQLiteDatabase = this.writableDatabase

  override fun onCreate(db: SQLiteDatabase?) {
//    TODO("Not yet implemented")
  }

  override fun onUpgrade(db: SQLiteDatabase?, oldVersion: Int, newVersion: Int) {
//    TODO("Not yet implemented")
  }

  fun executeSql(sql: String, params: Array<Any?>): MutableList<MutableList<Any?>?> {
    var cursor: Cursor? = null
    try {
      cursor = db.rawQuery(buildQuery(sql, params), Array(0) {""})
      val result = MutableList<MutableList<Any?>?>(0) { null }
      if (cursor.moveToFirst()) {
        val header = MutableList<Any?>(0) {null}
        (0 until cursor.columnCount).forEach {
          header.add(cursor.getColumnName(it))
        }
        result.add(header)

        do {
          val row = MutableList<Any?>(0) {null}
          (0 until cursor.columnCount).forEach {
            when (cursor.getType(it)) {
              FIELD_TYPE_NULL -> row.add(null)
              FIELD_TYPE_INTEGER -> row.add(cursor.getLong(it))
              FIELD_TYPE_FLOAT -> row.add(cursor.getDouble(it))
              FIELD_TYPE_STRING -> row.add(cursor.getString(it))
              FIELD_TYPE_BLOB -> row.add(cursor.getBlob(it))
              else -> {
                row[it] = row.add(null)
              }
            }
          }
          result.add(row)
        } while (cursor.moveToNext())
      }
      return result
    } finally {
      cursor?.close()
    }
  }

  fun getLastInsertRowId(): Long? {
    var cursor: Cursor? = null
    try {
      cursor = db.rawQuery("SELECT last_insert_rowid()", Array<String?>(0){null})
      if (cursor.moveToFirst()) {
        if (cursor.columnCount > 0 && cursor.getType(0) == FIELD_TYPE_INTEGER)
          return cursor.getLong(0)
      }
    }
    finally {
      cursor?.close()
    }

    return 0
  }

  fun beginTransaction() {
    db.beginTransaction()
  }

  fun commitTransaction() {
    db.setTransactionSuccessful()
  }

  fun endTransaction() {
    db.endTransaction()
  }

  private fun buildQuery(sql: String, params: Array<Any?>): String {
    val parametersRegexp = Regex("(\"([^]\"]*)\"|'([^']*)'|\\[([^\\[]*)\\])|(\\?)")

    var bindSql = sql
    (params.indices).forEach {
      val value = params[it]

      val matchResults = parametersRegexp.findAll(bindSql)
      var placeholderIndex: Int? = null
      for (matchResult in matchResults) {
        placeholderIndex = matchResult.groups[5]?.range?.first
        if (placeholderIndex != null) break
      }

      if (placeholderIndex != null) {
        val sqlValue = if (value == null) {
          "NULL"
        } else if (value is Double) {
          BigDecimal(value).toPlainString()
        } else if (value is Boolean) {
          if (value) "1" else "0"
        } else if (value is ByteArray) {
          String(value, Charsets.UTF_8)
        } else {
          DatabaseUtils.escapeString(value.toString())
        }

        bindSql = bindSql.substring(0, placeholderIndex) + sqlValue + bindSql.substring(placeholderIndex + 1)
      }
    }

    return bindSql
  }

  override fun close() {
    if (this.db.isOpen) {
      this.db.close();
    }

    super.close()
  }
}
