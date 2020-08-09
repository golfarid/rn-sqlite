package com.rnsqlite

import android.util.Log
import com.facebook.react.bridge.*
import java.lang.Exception
import java.util.*
import kotlin.collections.HashMap


@Suppress("unused")
class RnSqliteModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    companion object{
        val dbMap: HashMap<String, Database> = HashMap()
    }


    override fun getName(): String {
        return "RnSqlite"
    }

    @ReactMethod
    fun openDatabase(name: String, promise: Promise) {
        val uid: String = UUID.randomUUID().toString()
        val database = Database(reactApplicationContext, name, 1 /* ToDo implement upgrade logic later */)
        synchronized(dbMap) {
            dbMap.put(uid, database)
        }

        promise.resolve(uid)
    }

    @ReactMethod
    fun closeDatabase(uid: String) {
      synchronized(dbMap) {
        val database = dbMap.remove(uid)
        database?.close();
      }
    }

    @ReactMethod
    fun beginTransaction(uid: String, promise: Promise) {
      Log.d("RnSqliteModule", "Begin transaction")
      val db = dbMap[uid]
      db?.beginTransaction()
      promise.resolve(null)
    }

    @ReactMethod
    fun commitTransaction(uid: String, promise: Promise) {
      Log.d("RnSqliteModule", "Commit transaction")
      val db = dbMap[uid]
      db?.commitTransaction()
      promise.resolve(null)
    }

    @ReactMethod
    fun endTransaction(uid: String, promise: Promise) {
      Log.d("RnSqliteModule", "End transaction")
      val db = dbMap[uid]
      db?.endTransaction()
      promise.resolve(null)
    }

    @ReactMethod
    fun executeSql(uid: String, sql: String, params: ReadableArray, promise: Promise) {
      Log.d("RnSqliteModule", "Execute sql")
      val db = dbMap[uid]
      val result = db?.executeSql(sql, jsArrayToJavaArray(params))

      val rnRows = Arguments.createArray()
      val rowsIterator = result?.listIterator()
      if (rowsIterator != null) {
        for ((rowIndex, row) in rowsIterator.withIndex()) {
          if (rowIndex > 0) {
            val rnRow = Arguments.createMap()

            val columnsIterator: MutableListIterator<Any?>? = row?.listIterator()
            if (columnsIterator != null) {
              for ((columnIndex, value) in columnsIterator.withIndex()) {
                val columnName = result[0]?.get(columnIndex).toString()

                if (value == null) {
                  rnRow.putNull(columnName)
                } else {
                  when (value) {
                    is Int -> rnRow.putInt(columnName, value)
                    is String -> rnRow.putString(columnName, value)
                    is Float -> rnRow.putDouble(columnName, value.toDouble())
                    is ByteArray -> rnRow.putString(columnName, String(value, Charsets.UTF_8))
                  }
                }
              }
              rnRows.pushMap(rnRow)
            }
          }
        }
      }

      val rnResult = Arguments.createMap()
      rnResult.putArray("rows", rnRows)
      val lastInsertRowId = db?.getLastInsertRowId()
      if (lastInsertRowId != null && lastInsertRowId > 0) {
        rnResult.putInt("last_insert_row_id", lastInsertRowId)
      } else {
        rnResult.putNull("last_insert_row_id")
      }
      promise.resolve(rnResult)
    }

    private fun jsArrayToJavaArray(jsArray: ReadableArray?): Array<Any?> {
      if (jsArray != null) {
        val javaArray = Array<Any?>(jsArray.size()) { null }
        (0 until jsArray.size()).forEach {
          when (jsArray.getType(it)) {
            ReadableType.Null -> javaArray[it] = null
            ReadableType.Boolean -> javaArray[it] = jsArray.getBoolean(it)
            ReadableType.Number -> javaArray[it] = jsArray.getDouble(it)
            ReadableType.String -> javaArray[it] = jsArray.getString(it)
            ReadableType.Array -> javaArray[it] = jsArrayToJavaArray(jsArray.getArray(it))
            ReadableType.Map -> throw Exception("ReadableType.Map unsupported yet")
          }
        }

        return javaArray
      }

      return Array(0) { null }
    }
}
