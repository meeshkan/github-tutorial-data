export const sqlPromise = (connection, stmt, vars) => new Promise((resolve, reject) => connection.query(stmt, vars, (e, r) => e ? reject(e) : resolve(r)));
export const destroy = connection => connection.destroy();
