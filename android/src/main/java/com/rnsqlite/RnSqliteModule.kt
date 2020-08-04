package com.rnsqlite

import android.util.Log
import com.facebook.react.bridge.*
import java.lang.Exception


class RnSqliteModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "RnSqlite"
    }

    @ReactMethod
    fun openDatabase(name: String, promise: Promise) {
      Database.createInstance(reactApplicationContext, name, 1 /* ToDo implement upgrade logic later */)
      promise.resolve(null)
    }

    @ReactMethod
    fun beginTransaction(promise: Promise) {
      Log.d("RnSqliteModule", "Begin transaction")
      val db = Database.getInstance()
      db?.beginTransaction()
      promise.resolve(null)
    }

    @ReactMethod
    fun commitTransaction(promise: Promise) {
      Log.d("RnSqliteModule", "Commit transaction")
      val db = Database.getInstance()
      db?.commitTransaction()
      promise.resolve(null)
    }

    @ReactMethod
    fun endTransaction(promise: Promise) {
      Log.d("RnSqliteModule", "End transaction")
      val db = Database.getInstance()
      db?.endTransaction()
      promise.resolve(null)
    }

    @ReactMethod
    fun executeSql(sql: String, params: ReadableArray, promise: Promise) {
      Log.d("RnSqliteModule", "Execute sql")
      val db = Database.getInstance()
      val result = db?.executeSql(sql, jsArrayToJavaArray(params))

      val rnResult = Arguments.createArray();
      val rowsIterator = result?.listIterator()
      if (rowsIterator != null) {
        for (row in rowsIterator) {
          val rnRow = Arguments.createArray();

          val columnsIterator = row?.listIterator()
          if (columnsIterator != null) {
            for (value in columnsIterator) {
              if (value == null) {
                rnRow.pushNull()
              } else {
                when (value) {
                  is Int -> rnRow.pushInt(value)
                  is String -> rnRow.pushString(value)
                  is Float -> rnRow.pushDouble(value.toDouble())
                  is ByteArray -> rnRow.pushString(String(value, Charsets.UTF_8))
                }
              }
            }
            rnResult.pushArray(rnRow)
          }
        }
      }

      promise.resolve(rnResult)
    }

    fun jsArrayToJavaArray(jsArray: ReadableArray?): Array<Any?> {
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

        return javaArray;
      }

      return Array(0) { null }
    }
}
