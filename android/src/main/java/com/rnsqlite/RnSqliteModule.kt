package com.rnsqlite

import android.util.Log
import com.facebook.react.bridge.*
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

    val jsonRows = db?.executeSql(sql)

    val jsonResult = JSONObject()
    jsonResult.put("rows", jsonRows)
    val lastInsertRowId = db?.getLastInsertRowId()
    if (lastInsertRowId != null && lastInsertRowId > 0) {
      jsonResult.put("last_insert_row_id", lastInsertRowId)
    } else {
      jsonResult.put("last_insert_row_id", JSONObject.NULL)
    }

    val json = jsonResult.toString()
    promise.resolve(json)
  }
}
