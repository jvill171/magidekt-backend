const { BadRequestError } = require("../expressError");
const { sqlForPartialQuery, sqlForBulkInsertQuery } = require("./sql");

describe("sqlForPartialQuery", function(){
    const toUpdate = { f1:"v1" };
    const toSql = { f1:"F_1" }

    test("works: 1 non-JSONB", function(){
        const result = sqlForPartialQuery( toUpdate, toSql )

        expect(result).toEqual({
            setCols: '"F_1"=$1',
            values: [ 'v1' ]
          })
    })

    test("works: 1 JSONB", function(){
        const result = sqlForPartialQuery( toUpdate, toSql, [ "f1" ] )

        expect(result).toEqual({
            setCols: '"F_1"=$1::jsonb',
            values: [ '"v1"' ]
          })
    })

    test("works: mixed JSONB & non-JSONB", function(){
        const result = sqlForPartialQuery(
            { f1:"v1", f2:"v2", f3:"v3" },
            { f1:"F_1", f2:"F_2" },
            ["f2","f3"]
        )

        expect(result).toEqual({
            setCols: '"F_1"=$1, "F_2"=$2::jsonb, "f3"=$3::jsonb',
            values: [ 'v1', '"v2"', '"v3"' ]
          })
    })
    
    test("error: empty object", function(){
        try{
            sqlForPartialQuery( {}, {} )
        }
        catch(err){
            expect(err instanceof BadRequestError).toBeTruthy()
        }
    })
})

describe("sqlForBulkInsertQuery", function(){

    test("works: 1 object", function(){
        const result = sqlForBulkInsertQuery([
            {p1: 1, p2:"property 2" }
        ])

        expect(result).toEqual("($1, $2)")
    })

    test("works: multiple object", function(){
        const result = sqlForBulkInsertQuery([
            {p1: 1, p2:"property 2" },
            {p1: 3, p2:"property 4" },
            {p1: 4, p2:"property 6" }
        ])

        expect(result).toEqual("($1, $2),($3, $4),($5, $6)")
    })

    test("error: empty array", function(){
        try{
            sqlForBulkInsertQuery([])
        }
        catch(err){
            expect(err instanceof BadRequestError).toBeTruthy()
        }
    })
})