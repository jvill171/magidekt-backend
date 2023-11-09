"use strict";

const { NotFoundError } = require("../expressError");
const db = require("../db.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");
const Deck = require("./deck.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


// /************************************** createDeck */

describe("createDeck",()=>{
    const newDeck = {
        deckName: "newDeck",
        description: "newDesc",
        format: "standard",
        colorIdentity: "R",
        tags: ["Test"],
    }
    test("works", async ()=>{
        const res = await Deck.createDeck("u1", newDeck )
        expect(res).toEqual({
            id: expect.any(Number),
            deckOwner: 'u1',
            ...newDeck
        });
    })

    test("not found: invalid user", async ()=>{
        try{
        await Deck.createDeck("nope", newDeck )
        fail();
        }catch(err){
            expect(err instanceof NotFoundError).toBeTruthy()
        }
    })
})
// /************************************** findAllDecks */

describe("findAllDecks",()=>{
    test("works", async ()=>{
        let res = await Deck.findAllDecks({})

        expect(res.totalPages).toEqual(expect.any(Number))
        expect(res.currentPage).toEqual(expect.any(Number))
        expect(res.totalDecks).toEqual(expect.any(Number))
        expect(res.decks).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(Number),
                    deckName: expect.any(String),
                    description: expect.any(String),
                    format: expect.any(String),
                    colorIdentity: expect.any(String),
                    tags: expect.any(Array),
                },
            ])
        )
    })
})
// /************************************** findUserDecks */

describe("findUserDecks",()=>{
    test("works", async ()=>{
        let res = await Deck.findUserDecks("u1")

        expect(res.length).toEqual(2);
        expect(res).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(Number),
                    deckName: expect.any(String),
                    description: expect.any(String),
                    format: expect.any(String),
                    colorIdentity: expect.any(String),
                    tags: expect.any(Array),
                    displayName: "U1",
                    cardCount: expect.stringMatching(/^\d+$/), 
                },
            ])
        )
    })

    test("not found: invalid user", async ()=>{
        try{
            await Deck.findUserDecks("nope")
        }catch(err){
            expect(err instanceof NotFoundError).toBeTruthy()
        }
    })
})
// /************************************** get */

describe("get",()=>{
    let userDecks, deckId;
    beforeAll(async () =>{
        userDecks = await Deck.findUserDecks("u1")
        deckId = userDecks[0].id;
    })
    test("works, with owner", async ()=>{
        const res = await Deck.get(deckId, "u1")
        expect(res).toEqual({
            id: expect.any(Number),
            deckName: 'd1',
            description: 'desc1',
            format: 'standard',
            colorIdentity: 'WUBRG',
            tags: [ 'D1t1' ],
            cards: expect.any(Array)
        });
    })
    test("works, no owner", async ()=>{
        const res = await Deck.get(deckId)
        expect(res).toEqual({
            id: expect.any(Number),
            deckName: 'd1',
            description: 'desc1',
            format: 'standard',
            colorIdentity: 'WUBRG',
            tags: [ 'D1t1' ],
            cards: expect.any(Array)
        });
    })

    test("not found: invalid/wrong owner", async ()=>{
        try{
            await Deck.get(deckId, "nope")
            fail();
        }catch(err){
            expect(err instanceof NotFoundError).toBeTruthy()
        }
    });

})
// /************************************** update */

describe("update",()=>{
    const updateData = {
        deckName: "New Name",
        description: "New Desc",
        format: "commander",
        colorIdentity: "U",
        tags: ["New", "Tags"],
    }
    let deckId;
    beforeAll(async () =>{
        const userDecks = await Deck.findUserDecks("u1")
        deckId = userDecks[0].id;
    })

    test("works", async ()=>{
        const res = await Deck.update(deckId, updateData)
        expect(res).toEqual({
            id: expect.any(Number),
            deckOwner: 'u1',
            ...updateData,
        });
    })

    test("works, change owner", async ()=>{
        const newUpdateData = {
            ...updateData,
            deckOwner: "u2"
        }
        const res = await Deck.update(deckId, newUpdateData)
        expect(res).toEqual({
            id: expect.any(Number),
            deckOwner: 'u2',
            ...updateData,
        });
    })

    test("not found: bad deckId", async ()=>{
        try{
            await Deck.update( 0 , updateData)
        }catch(err){
            expect(err instanceof NotFoundError).toBeTruthy()
        }
    })
})
// /************************************** remove */

describe("remove",()=>{
    let deck;
    beforeEach(async ()=>{
        const deckToDel = {
            deckName: "toDelete",
            format:"standard"
        }
        deck = await Deck.createDeck( "u1", deckToDel )
    })

    test("works", async ()=>{
        // Check how many rows exist in db after new entry
        const resCount = await db.query(`SELECT COUNT(*) FROM decks`)
        const count = parseInt(resCount.rows[0].count)

        // Remove the newly added deck
        await Deck.remove(deck.id)

        // Check how many rows exist in db after deletion of new entry
        const countRes = await db.query(`SELECT COUNT(*) FROM decks`)
        const newCount = parseInt(countRes.rows[0].count)

        expect(newCount).toEqual(count - 1)
    })
    
    test("not found: remove same deck x2", async ()=>{
        try{
            await Deck.remove(deck.id)
            await Deck.remove(deck.id)
        }catch(err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })

    test("not found: no id given", async ()=>{
        try{
            await Deck.remove()
            fail();
        }catch(err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
})
// /************************************** getDeckFormats */

describe("getDeckFormats",()=>{
    test("works", async ()=>{
        const res = await Deck.getDeckFormats()
        expect(res.length).toEqual(21) // # of valid formats from ENUM
    })
})