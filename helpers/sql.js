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

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/**
 * Helper for bulk inserting items from an array
 * 
 * @param dataToAdd Array of Objects [ { prop1, prop2, ... }, ...]
 * 
 * @returns placeholders
 * 
 * @example [{"cardId": 'A', "quantity": 2}, {"cardId": 'B', "quantity": 3}] =>
 *     placeholders: '($1, $2), ($3, $4)'
 */
function sqlForBulkInsertQuery(dataToAdd){
  if(dataToAdd.length === 0) throw new BadRequestError("No Data")

  // Based on first obj in array, count how many properties to expect
  const keyLen = Object.keys(dataToAdd[0]).length;

  // [ {"p1": "A", "p2": 2}, {"p1": "B", "p2": 3}, ... ] => ['($1, $2)', '($3, $4)', ...]
  const phArr = dataToAdd.map((_, idx) => {
    const ph = Array.from({ length: keyLen }, (_, propCount) =>
      `$${idx * keyLen + propCount + 1}`
    );
    return `(${ph.join(", ")})`;
  });

  // phArr['($1, $2)', '($3, $4)', ...]  =>  '($1, $2), ($3, $4), ...'
  const placeholders = phArr.join();

  return placeholders;
}

module.exports = { sqlForPartialQuery, sqlForBulkInsertQuery};