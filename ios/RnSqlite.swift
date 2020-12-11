import SQLite3

@objc(RnSqlite)
class RnSqlite: NSObject {
    var lock = NSLock()
    static var dbMap = [String : OpaquePointer]()
    
    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc(openDatabase:withResolver:withRejecter:)
    func openDatabase(name: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        lock.lock()
        if RnSqlite.dbMap[name] != nil {
            resolve(name)
        } else {
            let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
            let documentsDirectory = paths[0]
            let dbPath = documentsDirectory
                .appendingPathComponent("..")
                .appendingPathComponent("Library")
                .appendingPathComponent(name)

            NSLog(dbPath.absoluteString)
            var db: OpaquePointer?
            if sqlite3_open(dbPath.absoluteString, &db) != SQLITE_OK {
                reject("-1", "Database open failed", nil)
            } else {
                if sqlite3_busy_timeout(db, 30000) != SQLITE_OK {
                    reject("-1", "Database busy timeout setup failed", nil)
                } else {
                    RnSqlite.dbMap[name] = db
                    resolve(name)
                }
            }
        }
        lock.unlock()
    }

    @objc(closeDatabase:withResolver:withRejecter:)
    func closeDatabase(name: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        lock.lock()
        let db = RnSqlite.dbMap[name]
        if sqlite3_close(db) != SQLITE_OK {
            reject("-1", "Database close failed", nil)
        } else {
            RnSqlite.dbMap.removeValue(forKey: name)
            resolve(nil)
        }
        lock.unlock()
    }


    @objc(executeSql:withSql:withResolver:withRejecter:)
    func executeSql(name: String,
                    sql: String,
                    resolve:RCTPromiseResolveBlock,
                    reject:RCTPromiseRejectBlock) -> Void {
        var stmt: OpaquePointer?

        let db = RnSqlite.dbMap[name]
        if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) != SQLITE_OK {
            let errmsg = String(cString: sqlite3_errmsg(db)!)
            reject("-1", "Query failed \(errmsg)", nil)
        } else {
            let rows = NSMutableArray()
            var done = false
            var failed = false
            
            var columns = Array<String>()
            while (!done && !failed) {
                let result = sqlite3_step(stmt)
                switch result {
                    case SQLITE_DONE:
                        done = true
                        break
                    case SQLITE_ROW:
                        if columns.count == 0 {
                            for i in 0..<sqlite3_column_count(stmt) {
                                columns.append(String(cString: sqlite3_column_name(stmt, i)))
                            }
                        }

                        let row = NSMutableDictionary()

                        for i in 0..<columns.count {
                            let columnName = columns[i]
                            switch (sqlite3_column_type(stmt, Int32(i))) {
                                case SQLITE_NULL:
                                    row[columnName] = NSNull()
                                    break
                                case SQLITE_INTEGER:
                                    row[columnName] = sqlite3_column_int64(stmt, Int32(i))
                                    break
                                case SQLITE_FLOAT:
                                    row[columnName] = sqlite3_column_double(stmt, Int32(i))
                                    break
                                case SQLITE3_TEXT:
                                    row[columnName] = String(cString: sqlite3_column_text(stmt, Int32(i)))
                                    break
                                case SQLITE_BLOB:
                                    row[columnName] = NSNull()
                                    break
                                default:
                                    row[columnName] = NSNull()
                                    break
                            }
                        }

                        rows.add(row)
                        break
                    default:
                        failed = true
                        let errmsg = String(cString: sqlite3_errmsg(db)!)
                        reject("-1", "Query failed \(errmsg)", nil)
                }
            }
            
            sqlite3_finalize(stmt)
            if done {
                let lastInsertRowId = sqlite3_last_insert_rowid(db)

                let result = NSMutableDictionary()
                result["rows"] = rows
                if (lastInsertRowId > 0) {
                    result["last_insert_row_id"] = lastInsertRowId
                } else {
                    result["last_insert_row_id"] = NSNull()
                }

                resolve(result)
            }
        }
    }

    @objc(beginTransaction:withResolver:withRejecter:)
    func beginTransaction(name: String,
                          resolve:RCTPromiseResolveBlock,
                          reject:RCTPromiseRejectBlock) {
        lock.lock()
        let db = RnSqlite.dbMap[name]
        if sqlite3_get_autocommit(db) != 0 {
            if (sqlite3_exec(db, "BEGIN TRANSACTION", nil, nil, nil) != SQLITE_OK) {
                NSLog("Transaction start failed")
                reject("-1", "Transaction start failed", nil)
            } else {
                NSLog("Transaction successfully started")
                resolve(nil)
            }
        } else {
            resolve("BUSY")
        }
        lock.unlock()
    }

    @objc(commitTransaction:withResolver:withRejecter:)
    func commitTransaction(name: String,
                           resolve:RCTPromiseResolveBlock,
                           reject:RCTPromiseRejectBlock) {
        lock.lock()
        let db = RnSqlite.dbMap[name]
        if (sqlite3_exec(db, "COMMIT TRANSACTION", nil, nil, nil) != SQLITE_OK) {
            NSLog("Transaction start failed")
            reject("-1", "Transaction commit failed", nil)
        } else {
            NSLog("Transaction successfully commited")
            resolve(nil)
        }
        lock.unlock()
    }

    @objc(rollbackTransaction:withResolver:withRejecter:)
    func rollbackTransaction(name: String,
                             resolve:RCTPromiseResolveBlock,
                             reject:RCTPromiseRejectBlock) {
        lock.lock()
        let db = RnSqlite.dbMap[name]
        if (sqlite3_exec(db, "ROLLBACK TRANSACTION", nil, nil, nil) != SQLITE_OK) {
            NSLog("Transaction rollback failed")
            reject("-1", "Transaction rollback failed", nil)
        } else {
            NSLog("Transaction successfully rolled back")
            resolve(nil)
        }
        lock.unlock()
    }
}
