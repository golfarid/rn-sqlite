package com.rnsqlite

import android.content.Context
import android.database.Cursor
import android.database.Cursor.*
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

class Database(context: Context, name: String, version: Int):
  SQLiteOpenHelper(context, name, null, version) {
  companion object {
    @Volatile
    private var INSTANCE: Database? = null

    fun createInstance(context: Context, name: String, version: Int): Database =
      INSTANCE ?: synchronized(this) {
        INSTANCE ?: Database(context, name, version).also { INSTANCE = it }
      }

    fun getInstance(): Database? = INSTANCE
  }

  override fun onCreate(db: SQLiteDatabase?) {
//    TODO("Not yet implemented")
  }

  override fun onUpgrade(db: SQLiteDatabase?, oldVersion: Int, newVersion: Int) {
//    TODO("Not yet implemented")
  }

  fun executeSql(sql: String, params: Array<Any?>): MutableList<MutableList<Any?>?> {
    var cursor: Cursor? = null
    try {
      val db = this.writableDatabase
      cursor = db.rawQuery(sql, escapeParams(params))
      val result = MutableList<MutableList<Any?>?>(0) { null }
      if (cursor.moveToFirst()) {
        do {
          val row = MutableList<Any?>(0) {null}
          (0 until cursor.columnCount).forEach {
            when (cursor.getType(it)) {
              FIELD_TYPE_NULL -> row.add(null)
              FIELD_TYPE_INTEGER -> row.add(cursor.getInt(it))
              FIELD_TYPE_FLOAT -> row.add(cursor.getFloat(it))
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

  fun beginTransaction() {
    val db = this.writableDatabase
    db.beginTransaction()
  }

  fun commitTransaction() {
    val db = this.writableDatabase
    db.setTransactionSuccessful()
  }

  fun endTransaction() {
    val db = this.writableDatabase
    db.endTransaction()
  }

  private fun escapeParams(params: Array<Any?>): Array<String> {
    val strArray = Array(params.size) {""}
    (0 until params.size).forEach {
      strArray[it] = DatabaseUtils.escapeString(DatabaseUtils.objectToSqlString(params[it]))
    }

    return strArray;
  }
}
