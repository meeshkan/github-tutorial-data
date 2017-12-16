export const sqlPromise = (connection, stmt, vars) => new Promise((resolve, reject) => connection.query(stmt, vars, (e, r) => e ? reject(e) : resolve(r)));
export const beginTransaction = connection => new Promise((resolve, reject) => connection.beginTransaction(e => e ? reject(e) : resolve(true)));
export const commitTransaction = connection => new Promise((resolve, reject) => connection.commit(e => e ? reject(e) : resolve(true)));
export const rollbackTransaction = connection => new Promise((resolve, reject) => connection.rollback(e => e ? reject(e) : resolve(true)));