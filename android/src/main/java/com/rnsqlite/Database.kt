package com.rnsqlite

import android.content.Context
import android.database.Cursor
import android.database.Cursor.*
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.util.Log

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

  fun getLastInsertRowId(): Int? {
    var cursor: Cursor? = null
    try {
      cursor = db.rawQuery("SELECT last_insert_rowid()", Array<String?>(0){null})
      if (cursor.moveToFirst()) {
        if (cursor.columnCount > 0 && cursor.getType(0) == FIELD_TYPE_INTEGER)
          return cursor.getInt(0)
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
    var bindSql = sql
    (params.indices).forEach {
      val value = params[it]
      if (value == null) {
        bindSql = bindSql.replaceFirst("?", "NULL")
      } else if (value is Double || value is Float) {
        bindSql = bindSql.replaceFirst("?", value.toString())
      } else if (value is Number) {
        bindSql = bindSql.replaceFirst("?", value.toString())
      } else if (value is Boolean) {
        bindSql = bindSql.replaceFirst("?", if (value) "1" else "0")
      } else if (value is ByteArray) {
        bindSql = bindSql.replaceFirst("?", String(value, Charsets.UTF_8))
      } else {
        bindSql = bindSql.replaceFirst("?", DatabaseUtils.escapeString(value.toString()))
      }
    }

    return bindSql
  }

  private fun escapeParams(params: Array<Any?>): Array<String> {
    val strArray = Array(params.size) {""}
    (params.indices).forEach {
      var strParam = DatabaseUtils.objectToSqlString(params[it])
//      if (params[it] is String)
//        strParam = DatabaseUtils.escapeString(strParam)

      strArray[it] = strParam
    }

    return strArray
  }

  override fun close() {
    if (this.db.isOpen) {
      this.db.close();
    }

    super.close()
  }
}
