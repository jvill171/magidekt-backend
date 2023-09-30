const { BadRequestError } = require("../expressError");

/**
 * Helper for making selective update/select queries.
 *
 * The calling function can use it to make the SET clause of an SQL UPDATE
 * statement.
 * 
 * It can also be used to make the WHERE clause of a SQL SELECT statement.
 *
 * @param dataToUpdate {Object} {field1: newVal, field2: newVal, ...}
 * @param jsToSql {Object} maps js-style data fields to database column names,
 *   like {displayName: 'MTG_Master', email: "magidekt@magidekt.xyz"}
 *
 * @returns {Object} {sqlSetCols, dataToUpdate}
 *
 * @example {displayName: 'MTG_Master', email: "magidekt@magidekt.xyz"} =>
 *   { setCols: '"displayName"=$1, "email"=$2',
 *     values: ['MTG_Master', 'magidekt@magidekt.xyz'] }
 */

function sqlForPartialQuery(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {displayName: 'MTG_Master', email: "magidekt@magidekt.xyz"}
  //      => [display_name"=$1', '"email"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

   const returnValue = {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
  return returnValue
}

module.exports = { sqlForPartialQuery };