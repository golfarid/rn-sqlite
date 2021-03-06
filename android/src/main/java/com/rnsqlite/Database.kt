package com.rnsqlite

import android.content.Context
import android.database.Cursor
import android.database.Cursor.*
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class Database(context: Context, name: String, version: Int) :
  SQLiteOpenHelper(context, name, null, version) {
  private val db: SQLiteDatabase = this.writableDatabase

  override fun onCreate(db: SQLiteDatabase?) {
//    TODO("Not yet implemented")
  }

  override fun onUpgrade(db: SQLiteDatabase?, oldVersion: Int, newVersion: Int) {
//    TODO("Not yet implemented")
  }

  fun executeSql(sql: String): MutableList<MutableList<Any?>?> {
    var cursor: Cursor? = null
    try {
      cursor = db.rawQuery(sql, Array(0) {""})
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

  fun getLastInsertRowId(): Double? {
    var cursor: Cursor? = null
    try {
      cursor = db.rawQuery("SELECT last_insert_rowid()", Array<String?>(0){null})
      if (cursor.moveToFirst()) {
        if (cursor.columnCount > 0 && cursor.getType(0) == FIELD_TYPE_INTEGER)
          return cursor.getDouble(0)
      }
    }
    finally {
      cursor?.close()
    }

    return null
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

  fun isInTransaction(): Boolean {
    return db.inTransaction()
  }

  override fun close() {
    if (this.db.isOpen) {
      this.db.close()
    }

    super.close()
  }
}
