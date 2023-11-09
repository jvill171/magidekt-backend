const { BadRequestError } = require("../expressError");

/**
 * Helper for making selective update/select queries.
 *
 * The calling function can use it to make the SET clause of an SQL UPDATE
 * statement.
 * 
 * It can also be used to make the WHERE clause of a SQL SELECT statement.
 *
 * @param dataToUpdate {Object} {field1: val1, field2: val2, ...}
 * @param jsToSql {Object} maps js-style data fields to database column names,
 *   like {fieldOne: 'field_one', fieldTwo: "field_two"}
 * @param listJSONB [Array] an array of values to be considered as JSONB
 *
 * @returns {Object} {sqlSetCols, dataToUpdate}
 *
 * @example ( { f1:"v1", f2:"v2"}, { f1:"F_1" }, ["f2"] ) =>
 *   { setCols: '"F_1"=$1, "f2"=$2::jsonb',
 *     values: ['v1', 'v2'] }
 */

function sqlForPartialQuery(dataToUpdate, jsToSql, listJSONB = []) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  const vals = Object.values(dataToUpdate);
  // {displayName: 'MTG_Master', email: "magidekt@magidekt.xyz"}
  //      => [display_name"=$1', '"email"=$2']
  const cols = keys.map((colName, idx) =>{
    // Base return value
    const returnVal = `"${jsToSql[colName] || colName}"=$${idx + 1}`;

    if( !listJSONB.includes(colName) ){
      // Normal return
      return returnVal;
    }else{
      // Modify jsonb values & column & return
      vals[idx] = JSON.stringify(vals[idx]);
      return `${returnVal}::jsonb`;
    }
  });

  return {
    setCols: cols.join(", "),
    values: vals,
  };
}

/**
 * Helper for bulk inserting items from an array
 * 
 * @param dataToAdd Array of Objects [ { prop1, prop2, ... }, ...]
 * 
 * @returns a string of placeholders like: '($1, $2), ($3, $4), ...'
 * 
 * @example [{"cardId": 'A', "quantity": 2}, {"cardId": 'B', "quantity": 3}] =>
 *     placeholders: '($1, $2), ($3, $4)'
 */
function sqlForBulkInsertQuery(dataToAdd = []){
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