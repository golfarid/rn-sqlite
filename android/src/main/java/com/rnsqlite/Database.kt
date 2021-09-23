package com.rnsqlite

import android.content.Context
import android.database.Cursor
import android.database.Cursor.*
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject

class Database(context: Context, name: String, version: Int) :
  SQLiteOpenHelper(context, name, null, version) {
  private val db: SQLiteDatabase = this.writableDatabase

  override fun onCreate(db: SQLiteDatabase?) {
//    TODO("Not yet implemented")
  }

  override fun onUpgrade(db: SQLiteDatabase?, oldVersion: Int, newVersion: Int) {
//    TODO("Not yet implemented")
  }

  fun executeSql(sql: String): JSONArray {
    var cursor: Cursor? = null
    try {
      cursor = db.rawQuery(sql, Array(0) {""})
      val result = JSONArray()
      if (cursor.moveToFirst()) {
        val columns = mutableListOf<String>()
        (0 until cursor.columnCount).forEach {
          columns.add(it, cursor.getColumnName(it))
        }

        do {
          val row = JSONObject()
          (0 until cursor.columnCount).forEach {
            when (cursor.getType(it)) {
              FIELD_TYPE_NULL -> row.put(columns[it], JSONObject.NULL)
              FIELD_TYPE_INTEGER -> row.put(columns[it], cursor.getLong(it).toDouble())
              FIELD_TYPE_FLOAT -> row.put(columns[it], cursor.getDouble(it))
              FIELD_TYPE_STRING -> row.put(columns[it], cursor.getString(it))
              FIELD_TYPE_BLOB -> row.put(columns[it], String(cursor.getBlob(it), Charsets.UTF_8))
              else -> {
                row.put(columns[it], JSONObject.NULL)
              }
            }
          }
          result.put(cursor.position, row)
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
