"use strict";

export const TRANSACTION_WAIT_TIMEOUT = 30000;
export const TRANSACTION_CHECK_INTERVAL = 100;
export const delay = millis => new Promise(resolve => {
  setTimeout(() => resolve(), millis);
});
//# sourceMappingURL=sqlite.connection.js.map