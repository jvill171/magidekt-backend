"use strict";

const { NotFoundError } = require("../expressError");
const db = require("../db.js");
const Card = require("./card.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

// Mock validateCardIDs
jest.mock('../helpers/validateCardIDs.js'); 
const { validateCardIDs } = require('../helpers/validateCardIDs.js');

// Mock function for validateCardIDs
validateCardIDs.mockImplementation(async (cardList) => {
    const toReject = ['b4fbaee3-a10f-4b2d-b07e-d041a96a7e27']
    const cards = {
        not_found: [],
        found: [],
    }
    const reducedCards = cardList.reduce((result, c)=>{
        toReject.includes(c.cardId)
            ? result.not_found.push(c)
            : result.found.push(c)
        return result
    }, cards)
    return reducedCards;
});

const uuidPattern = /[0-9a-fA-F-]+/;

// /************************************** add */

describe("add", ()=>{
    // NOTE: This method requires the use of the validateCardIDs mock
    let deckId;
    beforeAll(async()=>{
        const decksRes = await db.query(
            `SELECT id FROM decks WHERE deck_owner = 'u1'`
        )
        deckId = decksRes.rows[0].id
        
    })
    const cardsToAdd = [
        {cardId: 'b4fbaee3-a10f-4b2d-b07e-d041a96a7e27', quantity: 1},
        {cardId: '317686d8-b762-4598-b74a-8b1fa6b899ba', quantity: 2}
    ]

    test("works", async()=>{
        const res = await Card.add(deckId, {deckCards: cardsToAdd})
        expect(res.rejectedData).toEqual([{ ...cardsToAdd[0] }])
        expect(res.added).toEqual([{
            cardId: cardsToAdd[1].cardId,
            quantity: cardsToAdd[1].quantity.toString()
        }])
    })

    test("not found: bad deckId", async()=>{
        try{
            await Card.add(deckId, {deckCards: cardsToAdd})
        }catch(err){
            expect(err instanceof NotFoundError).toBeTruthy()
        }
    })
    
})
// /************************************** get */

describe("get", ()=>{

    let deckId;
    beforeAll(async()=>{
        const decksRes = await db.query(
            `SELECT id FROM decks WHERE deck_owner = 'u1'`
        )
        deckId = decksRes.rows[0].id
    })

    test("works", async()=>{
        const res = await Card.get(deckId)
        
        expect(res.length).toEqual(3);
        expect(res[0].cardId).toMatch(uuidPattern)
        expect(parseInt(res[0].quantity)).toEqual(expect.any(Number))
    })

    test("not found: bad deckId", async()=>{
        try{
            await Card.get(0)
        }catch(err){
            expect(err instanceof NotFoundError).toBeTruthy()
        }
    })
})
// /************************************** findAll */

describe("findAll", ()=>{
    test("works", async()=>{
        const countRes = await db.query(`SELECT COUNT(*) FROM cards`)
        const totalCards = parseInt(countRes.rows[0].count)

        const res = await Card.findAll()
        expect(res.length).toEqual(totalCards)

        expect(res).toEqual(
            expect.arrayContaining([{
                deckId: expect.any(Number),
                cardId: expect.stringMatching(uuidPattern), 
                quantity: expect.stringMatching(/^\d+$/), // quantity as a number
            }])
        )
    })
})
// /************************************** update */

describe("update", ()=>{
    
    let deckId, cards;
    beforeAll(async()=>{
        const decksRes = await db.query(
            `SELECT id FROM decks WHERE deck_owner = 'u1'`
        )
        deckId = decksRes.rows[0].id

        const cardsRes = await db.query(
            `SELECT card_id AS "cardId",
                    quantity
             FROM cards WHERE deck_id = $1`,
            [deckId]);
        cards = cardsRes.rows
    })

    test("works, updates existing", async()=>{
        const updatedCards = cards.map(c => ({
            ...c,
            quantity: 12
          }))
        const res = await Card.update(deckId, { deckCards: updatedCards })

        expect(res.rejectedData).toEqual([])
        expect(res.updated).toEqual([
            {cardId: updatedCards[0].cardId, quantity: '12'},
            {cardId: updatedCards[1].cardId, quantity: '12'},
            {cardId: updatedCards[2].cardId, quantity: '12'},
        ])
    })

    test("works, rejects non-existing", async()=>{
        const nonExist = [
            {cardId: 'b4fbaee3-a10f-4b2d-b07e-d041a96a7e27', quantity: 10},
            {cardId: '317686d8-b762-4598-b74a-8b1fa6b899ba', quantity: 20}
        ];
        const res = await Card.update(deckId, { deckCards: nonExist })

        expect(res.rejectedData).toEqual(nonExist)
        expect(res.updated).toEqual([])
    })

    test("not found: invalid deckId", async()=>{
        try{
            await Card.update(0, { deckCards: cards })
        }catch(err){
            expect(err instanceof NotFoundError).toBeTruthy()
        }
    })
})
// /************************************** remove */

describe("remove", ()=>{
    
    let deckId;
    beforeAll(async()=>{
        const decksRes = await db.query(
            `SELECT id FROM decks WHERE deck_owner = 'u1'`
        )
        deckId = decksRes.rows[0].id
    })

    const cardUUIDs = [
        'b4fbaee3-a10f-4b2d-b07e-d041a96a7e27', '317686d8-b762-4598-b74a-8b1fa6b899ba'
    ];

    beforeEach(async ()=>{
        await db.query(`
        INSERT INTO cards( deck_id, card_id, quantity )
        VALUES ( $1, $2, 1 ),
               ( $1, $3, 10 )`
        , [deckId, ...cardUUIDs])
    })

    test("works", async()=>{
        // Check how many cards
        const preDelete =  await db.query(`SELECT card_id FROM cards`);
        const preLength = preDelete.rows.length;

        // Delete cards
        await Card.remove(deckId, cardUUIDs)

        // Check how many cards again after deletion
        const postDelete =  await db.query(`SELECT card_id FROM cards`);
        const postLength = postDelete.rows.length;

        expect(postLength).toEqual(preLength - cardUUIDs.length)
        
        expect(1).toEqual(1);
    })

    test("not found: invalid deckId", async()=>{
        try{
            await Card.remove(0, cardUUIDs)
        }catch(err){
            expect(err instanceof NotFoundError).toBeTruthy()
        }
    })
})
