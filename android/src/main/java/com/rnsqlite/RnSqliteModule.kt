package com.rnsqlite

import android.util.Log
import com.facebook.react.bridge.*
import com.google.gson.*
import org.json.JSONArray
import org.json.JSONObject
import kotlin.collections.HashMap


@Suppress("unused")
class RnSqliteModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  companion object {
    val dbMap: HashMap<String, Database> = HashMap()
  }

  override fun getName(): String {
    return "RnSqlite"
  }

  @ReactMethod
  @Synchronized fun openDatabase(name: String, promise: Promise) {
    val db = dbMap[name]
    if (db != null) {
      promise.resolve(name)
    } else {
      val database = Database(reactApplicationContext, name, 1 /* ToDo implement upgrade logic later */)
      dbMap[name] = database
      promise.resolve(name)
    }
  }

  @ReactMethod
  @Synchronized fun closeDatabase(name: String) {
    val database = dbMap.remove(name)
    database?.close()
  }

  @ReactMethod
  @Synchronized fun beginTransaction(name: String, promise: Promise) {
    Log.d("RnSqliteModule", "Begin transaction")
    val db = dbMap[name]
    val inTransaction = db?.isInTransaction()
    if (inTransaction != null && !inTransaction) {
      db.beginTransaction()
      promise.resolve(null)
    } else {
      promise.resolve("BUSY")
    }
  }

  @ReactMethod
  @Synchronized fun commitTransaction(name: String, promise: Promise) {
    Log.d("RnSqliteModule", "Commit transaction")
    val db = dbMap[name]
    db?.commitTransaction()
    promise.resolve(null)
  }

  @ReactMethod
  @Synchronized fun endTransaction(name: String, promise: Promise) {
    Log.d("RnSqliteModule", "End transaction")
    val db = dbMap[name]
    db?.endTransaction()
    promise.resolve(null)
  }

  @ReactMethod
  fun executeSql(name: String, sql: String, promise: Promise) {
    val db = dbMap[name]

    val result = db?.executeSql(sql)

    val jsonRows = JsonArray()
    val rowsIterator = result?.listIterator()
    if (rowsIterator != null) {
      for ((rowIndex, row) in rowsIterator.withIndex()) {
        if (rowIndex > 0) {
          val jsonRow = JsonObject()
          
          val columnsIterator: MutableListIterator<Any?>? = row?.listIterator()
          if (columnsIterator != null && columnsIterator.hasNext()) {
            for ((columnIndex, value) in columnsIterator.withIndex()) {
              val columnName = result[0]?.get(columnIndex).toString()

              if (value == null) {
                jsonRow.add(columnName, JsonNull.INSTANCE)
              } else {
                when (value) {
                  is Long -> jsonRow.addProperty(columnName, value.toDouble())
                  is String -> jsonRow.addProperty(columnName, value)
                  is Double -> jsonRow.addProperty(columnName, value)
                  is ByteArray -> jsonRow.addProperty(columnName, String(value, Charsets.UTF_8))
                }
              }
            }
          }
          jsonRows.add(jsonRow)
        }
      }
    }

    val jsonResult = JsonObject()
    jsonResult.add("rows", jsonRows)
    val lastInsertRowId = db?.getLastInsertRowId()
    if (lastInsertRowId != null && lastInsertRowId > 0) {
      jsonResult.addProperty("last_insert_row_id", lastInsertRowId)
    } else {
      jsonResult.add("last_insert_row_id", JsonNull.INSTANCE)
    }

    val gson = Gson()
    Log.d("RnSqliteModule", gson.toJson(jsonResult))
    promise.resolve(gson.toJson(jsonResult))
  }
}
