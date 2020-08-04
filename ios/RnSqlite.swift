import SQLite3

@objc(RnSqlite)
class RnSqlite: NSObject {
    var db: OpaquePointer?
    
    @objc(openDatabase:withResolver:withRejecter:)
    func openDatabase(name: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let filePath = try! FileManager.default.url(for: .documentDirectory, in: .userDomainMask, appropriateFor: nil, create: false).appendingPathExtension(name)
        
        
        if sqlite3_open(filePath.path, &db) != SQLITE_OK {
            NSLog("There is error in creating DB")
            reject("-1", "Database open failed", nil)
        } else {
            NSLog("Database has been created with path \(name)")
            resolve(nil)
        }
    }
    
    @objc(executeSql:withParams:withResolver:withRejecter:)
    func executeSql(sql: String,
                    params: Array<AnyObject>,
                    resolve:RCTPromiseResolveBlock,
                    reject:RCTPromiseRejectBlock) -> Void {
        var stmt: OpaquePointer?
        
        if sqlite3_prepare_v2(db, sql, -1, &stmt, nil) != SQLITE_OK {
            let errmsg = String(cString: sqlite3_errmsg(db)!)
            NSLog("error preparing insert: \(errmsg)")
            reject("-1", "Query failed \(errmsg)", nil)
        } else {
            for (index, element) in params.enumerated() {
                NSLog("parameter \(type(of: element))")
                switch element
                {
                    case is NSNull:
                        if sqlite3_bind_null(stmt, Int32(index + 1)) != SQLITE_OK {
                            let errmsg = String(cString: sqlite3_errmsg(db)!)
                            NSLog("failure binding name: \(errmsg)")
                            reject("-1", "failure binding name: \(errmsg)", nil)
                            return
                        }
                    case is String:
                        if sqlite3_bind_text(stmt, Int32(index + 1), (element as! NSString).utf8String, -1, nil) != SQLITE_OK {
                            let errmsg = String(cString: sqlite3_errmsg(db)!)
                            NSLog("failure binding name: \(errmsg)")
                            reject("-1", "failure binding name: \(errmsg)", nil)
                            return
                        }
                    case is NSInteger:
                        if sqlite3_bind_int(stmt, Int32(index + 1), element as! Int32) != SQLITE_OK {
                            let errmsg = String(cString: sqlite3_errmsg(db)!)
                            NSLog("failure binding name: \(errmsg)")
                            reject("-1", "failure binding name: \(errmsg)", nil)
                            return
                        }
                    case is NSNumber:
                        if sqlite3_bind_double(stmt, Int32(index + 1), element as! Double) != SQLITE_OK {
                            let errmsg = String(cString: sqlite3_errmsg(db)!)
                            NSLog("failure binding name: \(errmsg)")
                            reject("-1", "failure binding name: \(errmsg)", nil)
                            return
                        }
                    case is Bool:
                        if sqlite3_bind_int(stmt, Int32(index + 1), (element as! Bool) ? 1 : 0) != SQLITE_OK {
                            let errmsg = String(cString: sqlite3_errmsg(db)!)
                            NSLog("failure binding name: \(errmsg)")
                            reject("-1", "failure binding name: \(errmsg)", nil)
                            return
                        }
                    default:
                        NSLog("failure binding parameter with index: \(index)")
                        reject("-1", "failure binding parameter with index: \(index)", nil)
                        return
                }
            }
            
            let result = NSMutableArray()
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                NSLog("Read row")
                let row = NSMutableArray()
                
                NSLog("Iterate columns")
                for i in 0..<sqlite3_column_count(stmt) {
                    NSLog("Column with index \(i)")
                    NSLog("Column of type \(sqlite3_column_type(stmt, i))")
                    switch (sqlite3_column_type(stmt, i)) {
                        case SQLITE_NULL:
                            row.add(NSNull())
                            break
                        case SQLITE_INTEGER:
                            row.add(sqlite3_column_int(stmt, i) as Int32)
                            break
                        case SQLITE_FLOAT:
                            row.add(sqlite3_column_double(stmt, i) as Double)
                            break
                        case SQLITE3_TEXT:
                            row.add(String(cString: sqlite3_column_text(stmt, i)))
                            break
                        case SQLITE_BLOB:
                            row.add(NSNull())
                            break
                        default:
                            row.add(NSNull())
                            break
                    }
                }
                
                result.add(row)
            }
            
            sqlite3_finalize(stmt)
            
            resolve(result)
        }
    }
    
    @objc(beginTransaction:withRejecter:)
    func beginTransaction(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) {
        if (sqlite3_exec(db, "BEGIN TRANSACTION", nil, nil, nil) != SQLITE_OK) {
            NSLog("Transaction start failed")
            reject("-1", "Transaction start failed", nil)
        } else {
            NSLog("Transaction successfully started")
            resolve(nil)
        }
    }
    
    @objc(commitTransaction:withRejecter:)
    func commitTransaction(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) {
        if (sqlite3_exec(db, "COMMIT TRANSACTION", nil, nil, nil) != SQLITE_OK) {
            NSLog("Transaction start failed")
            reject("-1", "Transaction commit failed", nil)
        } else {
            NSLog("Transaction successfully commited")
            resolve(nil)
        }
    }
    
    @objc(rollbackTransaction:withRejecter:)
    func rollbackTransaction(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) {
        if (sqlite3_exec(db, "ROLLBACK TRANSACTION", nil, nil, nil) != SQLITE_OK) {
            NSLog("Transaction rollback failed")
            reject("-1", "Transaction rollback failed", nil)
        } else {
            NSLog("Transaction successfully rolled back")
            resolve(nil)
        }
    }
}

struct ParameterBindError: Error {
    let value: AnyObject
}

