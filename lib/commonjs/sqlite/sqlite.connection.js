"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.delay = exports.TRANSACTION_WAIT_TIMEOUT = exports.TRANSACTION_CHECK_INTERVAL = void 0;
const TRANSACTION_WAIT_TIMEOUT = exports.TRANSACTION_WAIT_TIMEOUT = 30000;
const TRANSACTION_CHECK_INTERVAL = exports.TRANSACTION_CHECK_INTERVAL = 100;
const delay = millis => new Promise(resolve => {
  setTimeout(_ => resolve(_), millis);
});
exports.delay = delay;
//# sourceMappingURL=sqlite.connection.js.map