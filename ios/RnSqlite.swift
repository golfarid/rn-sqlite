import SQLite3

@objc(RnSqlite)
class RnSqlite: NSObject {
    static var dbMap = [String : OpaquePointer]()
    
    @objc static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc(openDatabase:withResolver:withRejecter:)
    func openDatabase(path: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        NSLog(path)
        var db: OpaquePointer?
        if sqlite3_open(path, &db) != SQLITE_OK {
            NSLog("There is error in creating DB")
            reject("-1", "Database open failed", nil)
        } else {
            NSLog("Database has been opened with path \(path)")
            let uid = NSUUID().uuidString
            RnSqlite.dbMap[uid] = db
            resolve(uid)
        }
    }
    
    @objc(closeDatabase:withResolver:withRejecter:)
    func closeDatabase(uid: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let db = RnSqlite.dbMap[uid]
        if sqlite3_close(db) != SQLITE_OK {
            NSLog("There is error in closing DB")
            reject("-1", "Database open failed", nil)
        } else {
            NSLog("Database has been closed")
            let db = RnSqlite.dbMap[uid]
            sqlite3_close(db)
            RnSqlite.dbMap.removeValue(forKey: uid)
            resolve(nil)
        }
    }
    
    @objc(executeSql:withSql:withParams:withResolver:withRejecter:)
    func executeSql(uid: String,
                    sql: String,
                    params: Array<AnyObject>,
                    resolve:RCTPromiseResolveBlock,
                    reject:RCTPromiseRejectBlock) -> Void {
        let startTimestamp = NSDate().timeIntervalSince1970
        
        var stmt: OpaquePointer?
        
        let db = RnSqlite.dbMap[uid]
        if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) != SQLITE_OK {
            let errmsg = String(cString: sqlite3_errmsg(db)!)
//            NSLog("error preparing insert: \(errmsg)")
            reject("-1", "Query failed \(errmsg)", nil)
        } else {
            do {
                try bindStatementParams(db: db, stmt: stmt, params: params)
            } catch let error as ParameterBindError {
                reject("-1", error.message, nil)
                return
            } catch {
                reject("-1", "error: \(error)", nil)
                return
            }
            
            let rows = NSMutableArray()
            var columns = Array<String>()
            while (sqlite3_step(stmt) == SQLITE_ROW) {
//                NSLog("Read row")
                
                if columns.count == 0 {
                    for i in 0..<sqlite3_column_count(stmt) {
                        columns.append(String(cString: sqlite3_column_name(stmt, i)))
                    }
                }
                
                let row = NSMutableDictionary()
                
//                NSLog("Iterate columns")
                for i in 0..<columns.count {
                    let columnName = columns[i]
//                    NSLog("Column with index \(i) with name \(columnName)")
                    switch (sqlite3_column_type(stmt, Int32(i))) {
                        case SQLITE_NULL:
                            row[columnName] = NSNull()
                            break
                        case SQLITE_INTEGER:
                            row[columnName] = sqlite3_column_int(stmt, Int32(i)) as Int32
                            break
                        case SQLITE_FLOAT:
                            row[columnName] = sqlite3_column_double(stmt, Int32(i)) as Double
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
            }
            
            sqlite3_finalize(stmt)
            let lastInsertRowId = sqlite3_last_insert_rowid(db)
            
            let result = NSMutableDictionary()
            result["rows"] = rows
            if (lastInsertRowId > 0) {
                result["last_insert_row_id"] = lastInsertRowId
            } else {
                result["last_insert_row_id"] = NSNull()
            }
            
            let queryTimestamp = NSDate().timeIntervalSince1970
            NSLog("Query \(queryTimestamp - startTimestamp)")
            resolve(result)
            let transportTimestamp = NSDate().timeIntervalSince1970
            NSLog("Transport \(transportTimestamp - queryTimestamp)")
        }
    }
    
    @objc(beginTransaction:withResolver:withRejecter:)
    func beginTransaction(uid: String,
                          resolve:RCTPromiseResolveBlock,
                          reject:RCTPromiseRejectBlock) {
        let db = RnSqlite.dbMap[uid]
        if (sqlite3_exec(db, "BEGIN TRANSACTION", nil, nil, nil) != SQLITE_OK) {
            NSLog("Transaction start failed")
            reject("-1", "Transaction start failed", nil)
        } else {
            NSLog("Transaction successfully started")
            resolve(nil)
        }
    }
    
    @objc(commitTransaction:withResolver:withRejecter:)
    func commitTransaction(uid: String,
                           resolve:RCTPromiseResolveBlock,
                           reject:RCTPromiseRejectBlock) {
        let db = RnSqlite.dbMap[uid]
        if (sqlite3_exec(db, "COMMIT TRANSACTION", nil, nil, nil) != SQLITE_OK) {
            NSLog("Transaction start failed")
            reject("-1", "Transaction commit failed", nil)
        } else {
            NSLog("Transaction successfully commited")
            resolve(nil)
        }
    }
    
    @objc(rollbackTransaction:withResolver:withRejecter:)
    func rollbackTransaction(uid: String,
                             resolve:RCTPromiseResolveBlock,
                             reject:RCTPromiseRejectBlock) {
        let db = RnSqlite.dbMap[uid]
        if (sqlite3_exec(db, "ROLLBACK TRANSACTION", nil, nil, nil) != SQLITE_OK) {
            NSLog("Transaction rollback failed")
            reject("-1", "Transaction rollback failed", nil)
        } else {
            NSLog("Transaction successfully rolled back")
            resolve(nil)
        }
    }
    
    private func bindStatementParams(db: OpaquePointer?, stmt: OpaquePointer?, params: Array<AnyObject>) throws {
        for (index, element) in params.enumerated() {
            try bindStatementParameter(db: db, stmt: stmt, index: index, parameter: element)
        }
    }
    
    private func bindStatementParameter(db: OpaquePointer?, stmt: OpaquePointer?, index: Int, parameter: AnyObject) throws {
        NSLog("parameter \(type(of: parameter))")
            switch parameter
            {
                case is NSNull:
                    if sqlite3_bind_null(stmt, Int32(index + 1)) != SQLITE_OK {
                        let errmsg = String(cString: sqlite3_errmsg(db)!)
                        throw ParameterBindError(value: parameter, message:errmsg)
                    }
                case is String:
                    if sqlite3_bind_text(stmt, Int32(index + 1), (parameter as! NSString).utf8String, -1, nil) != SQLITE_OK {
                        let errmsg = String(cString: sqlite3_errmsg(db)!)
                        throw ParameterBindError(value: parameter, message:errmsg)
                    }
                case is NSNumber:
                    if sqlite3_bind_double(stmt, Int32(index + 1), parameter as! Double) != SQLITE_OK {
                        let errmsg = String(cString: sqlite3_errmsg(db)!)
                        throw ParameterBindError(value: parameter, message:errmsg)
                    }
                case is NSInteger:
                    if sqlite3_bind_int(stmt, Int32(index + 1), parameter as! Int32) != SQLITE_OK {
                        let errmsg = String(cString: sqlite3_errmsg(db)!)
                        throw ParameterBindError(value: parameter, message:errmsg)
                    }
                case is Bool:
                    if sqlite3_bind_int(stmt, Int32(index + 1), (parameter as! Bool) ? 1 : 0) != SQLITE_OK {
                        let errmsg = String(cString: sqlite3_errmsg(db)!)
                        throw ParameterBindError(value: parameter, message:errmsg)
                    }
                default:
                    throw ParameterBindError(value: parameter, message: "Unexpected parameter type \(parameter)")
            }
    }
}

struct ParameterBindError: Error {
    let value: AnyObject
    let message: String
}

