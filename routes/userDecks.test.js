"use strict";

const request = require("supertest");

const app = require("../app");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  adminToken,
  u1Token,
  u2Token,
} = require("./_testCommon");
const db = require("../db");

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



/*************************************************
 * NOTE: All routes inherit the CorrectUserOrAdmin
 *       middleware from the parent route
 *       /users/:username/decks
 * **********************************************/

/**************************** POST    /users/:username/decks                */
describe("POST /users/:username/decks", ()=>{
    test("works for admin", async()=>{
        const resp = await request(app)
            .post(`/users/u1/decks`)
            .send({
                deckName: "deck",
                description: "deck desc",
                format: "standard",
                tags: ["Some", "Tags"],
                deckOwner:"u1"
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body).toEqual({
            deck: {
                id: expect.any(Number),
                deckName: 'deck',
                description: 'deck desc',
                format: 'standard',
                colorIdentity: null,
                tags: [ 'Some', 'Tags' ],
                deckOwner: 'u1'
            }
        })
    })
    test("works for correct user", async()=>{
        const resp = await request(app)
            .post(`/users/u1/decks`)
            .send({
                deckName: "deck",
                description: "deck desc",
                format: "standard",
                tags: ["Some", "Tags"],
                deckOwner:"u1"
            })
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body).toEqual({
            deck: {
                id: expect.any(Number),
                deckName: 'deck',
                description: 'deck desc',
                format: 'standard',
                colorIdentity: null,
                tags: [ 'Some', 'Tags' ],
                deckOwner: 'u1'
            }
        })
    })
    test("unauth for wrong user", async()=>{
        const resp = await request(app)
            .post(`/users/u1/decks`)
            .send({
                deckName: "deck",
                format: "standard",
                deckOwner:"u1"
            })
            .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toEqual(401)
    })
    test("unauth for anon", async()=>{
        const resp = await request(app)
            .post(`/users/u1/decks`)
            .send({
                deckName: "deck",
                format: "standard",
                deckOwner:"u1"
            })
        expect(resp.statusCode).toEqual(401)
    })
    test("bad request: missing data", async()=>{
        const resp = await request(app)
            .post(`/users/u1/decks`)
            .send({
                deckName: "deck",
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(400)
    })
    test("bad request if missing data", async()=>{
        const resp = await request(app)
            .post(`/users/u1/decks`)
            .send({
                deckName: "deck",
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(400)
    })
    test("bad request if invalid data", async()=>{
        const resp = await request(app)
            .post(`/users/u1/decks`)
            .send({
                deckName: 5,
                format: "standard",
                deckOwner:"u1"
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(400)
    })
})
/**************************** GET     /users/:username/decks                */
describe("GET /users/:username/decks/", ()=>{
    test("works for admin", async()=>{
        const resp = await request(app)
            .get(`/users/u1/decks`)
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body).toEqual({
            deckCollection: [
                {
                    id: expect.any(Number),
                    deckName: 'd1',
                    description: null,
                    format: 'standard',
                    colorIdentity: null,
                    tags: null,
                    displayName: 'u1',
                    cardCount: '4'
                },
                {
                    id: expect.any(Number),
                    deckName: 'd2',
                    description: null,
                    format: 'commander',
                    colorIdentity: null,
                    tags: null,
                    displayName: 'u1',
                    cardCount: '0'
                }
            ]
        })
    })
    test("works for correct user", async()=>{
        const resp = await request(app)
            .get(`/users/u1/decks`)
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body).toEqual({
            deckCollection: [
                {
                    id: expect.any(Number),
                    deckName: 'd1',
                    description: null,
                    format: 'standard',
                    colorIdentity: null,
                    tags: null,
                    displayName: 'u1',
                    cardCount: '4'
                },
                {
                    id: expect.any(Number),
                    deckName: 'd2',
                    description: null,
                    format: 'commander',
                    colorIdentity: null,
                    tags: null,
                    displayName: 'u1',
                    cardCount: '0'
                }
            ]
        })
    })
    test("unauth for wrong user", async()=>{
        const resp = await request(app)
            .get(`/users/u1/decks`)
            .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toEqual(401)
    })
    test("unauth for anon", async()=>{
        const resp = await request(app)
            .get(`/users/u1/decks`)
        expect(resp.statusCode).toEqual(401)
    })
})
/**************************** GET     /users/:username/decks/:deckId        */
describe("GET /users/:username/decks/:deckId", ()=>{
    let deckId;
    beforeAll(async ()=>{
        const deckResp = await db.query(` SELECT id FROM decks WHERE deck_owner = $1`, ["u1"])
        deckId = deckResp.rows[0].id
    })
    test("works for admin", async()=>{
        const resp = await request(app)
            .get(`/users/u1/decks/${deckId}`)
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body.deck).toEqual({
            id: expect.any(Number),
            deckName: 'd1',
            description: null,
            format: 'standard',
            colorIdentity: null,
            tags: null,
            cards: [
                { cardId: '9395fce4-11bf-4934-8323-5be4862c9779', quantity: '1' },
                { cardId: 'c4e9995e-f26b-4638-b69d-a310f58f0331', quantity: '1' },
                { cardId: 'edd69ea7-aab6-4f30-98f4-640cb0a6046c', quantity: '1' },
                { cardId: '2d76b7e3-6890-4120-8575-732909c8bdff', quantity: '1' }
            ]
          })
    })
    test("works for correct user", async()=>{
        const resp = await request(app)
            .get(`/users/u1/decks/${deckId}`)
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body.deck).toEqual({
            id: expect.any(Number),
            deckName: 'd1',
            description: null,
            format: 'standard',
            colorIdentity: null,
            tags: null,
            cards: [
                { cardId: '9395fce4-11bf-4934-8323-5be4862c9779', quantity: '1' },
                { cardId: 'c4e9995e-f26b-4638-b69d-a310f58f0331', quantity: '1' },
                { cardId: 'edd69ea7-aab6-4f30-98f4-640cb0a6046c', quantity: '1' },
                { cardId: '2d76b7e3-6890-4120-8575-732909c8bdff', quantity: '1' }
            ]
          })
    })
    test("unauth for wrong user", async()=>{
        const resp = await request(app)
            .get(`/users/u1/decks/${deckId}`)
            .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toEqual(401)
    })
    test("unauth for anon", async()=>{
        const resp = await request(app)
            .get(`/users/u1/decks/${deckId}`)
        expect(resp.statusCode).toEqual(401)
    })
})
/**************************** PATCH   /users/:username/decks/:deckId        */
describe("PATCH /users/:username/decks/:deckId", ()=>{
    let deckId;
    beforeAll(async ()=>{
        const deckResp = await db.query(`SELECT id FROM decks WHERE deck_owner = $1`, ["u1"])
        deckId = deckResp.rows[0].id
    })
    test("works for admin", async()=>{
        const resp = await request(app)
            .patch(`/users/u1/decks/${deckId}`)
            .send({
                deckName: "Deck NEW",
                description: "Desc NEW",
                format: "commander",
                colorIdentity: "R",
                tags: ["New"],
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body).toEqual({
            deck: {
                id: expect.any(Number),
                deckName: 'Deck NEW',
                description: 'Desc NEW',
                format: 'commander',
                colorIdentity: 'R',
                tags: [ 'New' ],
                deckOwner: 'u1'
            }
        })
    })
    test("works for correct user", async()=>{
        const resp = await request(app)
            .patch(`/users/u1/decks/${deckId}`)
            .send({
                deckName: "Deck NEW",
                description: "Desc NEW",
                format: "commander",
                colorIdentity: "R",
                tags: ["New"],
            })
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body).toEqual({
            deck: {
                id: expect.any(Number),
                deckName: 'Deck NEW',
                description: 'Desc NEW',
                format: 'commander',
                colorIdentity: 'R',
                tags: [ 'New' ],
                deckOwner: 'u1'
            }
        })
    })
    test("unauth for wrong user", async()=>{
        const resp = await request(app)
            .patch(`/users/u1/decks/${deckId}`)
            .send({
                deckName: "Deck NEW",
            })
            .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toEqual(401)
    })
    test("unauth for anon", async()=>{
        const resp = await request(app)
            .patch(`/users/u1/decks/${deckId}`)
            .send({
                deckName: "Deck NEW",
            })
        expect(resp.statusCode).toEqual(401)
    })
    test("bad request if invalid data", async()=>{
        const resp = await request(app)
            .patch(`/users/u1/decks/${deckId}`)
            .send({
                deckName: 5,
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(400)
    })
})
/**************************** DELETE  /users/:username/decks/:deckId        */
describe("DELETE /users/:username/decks/:deckId", ()=>{
    let deckId;
    beforeAll(async ()=>{
        const deckResp = await db.query(`SELECT id FROM decks WHERE deck_owner = $1`, ["u1"])
        deckId = deckResp.rows[0].id
    })
    test("works for admin", async()=>{
        const resp = await request(app)
            .delete(`/users/u1/decks/${deckId}`)
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body).toEqual({
            deleted: `${deckId}`
        })
    })
    test("works for correct user", async()=>{
        const resp = await request(app)
            .delete(`/users/u1/decks/${deckId}`)
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body).toEqual({
            deleted: `${deckId}`
        })
    })
    test("unauth for wrong user", async()=>{
        const resp = await request(app)
            .delete(`/users/u1/decks/${deckId}`)
            .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toEqual(401)
    })
    test("unauth for anon", async()=>{
        const resp = await request(app)
            .delete(`/users/u1/decks/${deckId}`)
        expect(resp.statusCode).toEqual(401)
    })
    test("not found invalid deckId", async()=>{
        const resp = await request(app)
            .delete(`/users/u1/decks/${0}`)
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(404)
    })
})
/**************************** POST    /users/:username/decks/:deckId/cards  */
describe("POST /users/:username/decks/:deckId/cards", ()=>{
    let deckId;
    beforeAll(async ()=>{
        const deckResp = await db.query(`SELECT id FROM decks WHERE deck_owner = $1`, ["u1"])
        deckId = deckResp.rows[0].id
    })
    const toReject = [{ cardId: "b4fbaee3-a10f-4b2d-b07e-d041a96a7e27", quantity: 1 }]
    const toAccept = [
        { cardId: "3d4468de-2452-47b6-9417-b92055e496eb", quantity: 2 },
        { cardId: "e965d32c-3151-48e8-b256-0b7fa8a8a211", quantity: 3 },
        { cardId: "cf002ecb-9afb-41b4-a6b8-327558ac947c", quantity: 4 },
    ]
    const deckCards = [ ...toReject, ...toAccept]

    test("works for admin", async()=>{
        const resp = await request(app)
            .post(`/users/u1/decks/${deckId}/cards`)
            .send({ deckCards })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body.cards).toEqual({
            rejectedData: toReject,
            added: [
                { cardId: "3d4468de-2452-47b6-9417-b92055e496eb", quantity: "2" },
                { cardId: "e965d32c-3151-48e8-b256-0b7fa8a8a211", quantity: "3" },
                { cardId: "cf002ecb-9afb-41b4-a6b8-327558ac947c", quantity: "4" },
            ]
        })
    })
    test("works for correct user", async()=>{
        const resp = await request(app)
            .post(`/users/u1/decks/${deckId}/cards`)
            .send({ deckCards })
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body.cards).toEqual({
            rejectedData: toReject,
            added: [
                { cardId: "3d4468de-2452-47b6-9417-b92055e496eb", quantity: "2" },
                { cardId: "e965d32c-3151-48e8-b256-0b7fa8a8a211", quantity: "3" },
                { cardId: "cf002ecb-9afb-41b4-a6b8-327558ac947c", quantity: "4" },
            ]
        })
    })
    test("unauth for wrong user", async()=>{
        const resp = await request(app)
            .post(`/users/u1/decks/${deckId}/cards`)
            .send({ deckCards })
            .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toEqual(401)
    })
    test("unauth for anon", async()=>{
        const resp = await request(app)
            .post(`/users/u1/decks/${deckId}/cards`)
            .send({ deckCards })
        expect(resp.statusCode).toEqual(401)
    })
    
    test("bad request if invalid deckCards", async()=>{
        const resp = await request(app)
            .post(`/users/u1/decks/${deckId}/cards`)
            .send({ deckCards: 0 })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(400)
    })
    test("bad request if no data", async()=>{
        const resp = await request(app)
            .post(`/users/u1/decks/${deckId}/cards`)
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(400)
    })
    test("not found if invalid deckId", async()=>{
        const resp = await request(app)
            .post(`/users/u1/decks/${0}/cards`)
            .send({ deckCards })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(404)
    })
})
/**************************** GET     /users/:username/decks/:deckId/cards  */
describe("GET /users/:username/decks/:deckId/cards", ()=>{
    let deckId;
    beforeAll(async ()=>{
        const deckResp = await db.query(`SELECT id FROM decks WHERE deck_owner = $1`, ["u1"])
        deckId = deckResp.rows[0].id
    })
    test("works for admin", async()=>{
        const resp = await request(app)
            .get(`/users/u1/decks/${deckId}/cards`)
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body).toEqual({
            cards: [
                { cardId: '9395fce4-11bf-4934-8323-5be4862c9779', quantity: '1' },
                { cardId: 'c4e9995e-f26b-4638-b69d-a310f58f0331', quantity: '1' },
                { cardId: 'edd69ea7-aab6-4f30-98f4-640cb0a6046c', quantity: '1' },
                { cardId: '2d76b7e3-6890-4120-8575-732909c8bdff', quantity: '1' }
            ]
        })
    })
    test("works for correct user", async()=>{
        const resp = await request(app)
            .get(`/users/u1/decks/${deckId}/cards`)
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body).toEqual({
            cards: [
                { cardId: '9395fce4-11bf-4934-8323-5be4862c9779', quantity: '1' },
                { cardId: 'c4e9995e-f26b-4638-b69d-a310f58f0331', quantity: '1' },
                { cardId: 'edd69ea7-aab6-4f30-98f4-640cb0a6046c', quantity: '1' },
                { cardId: '2d76b7e3-6890-4120-8575-732909c8bdff', quantity: '1' }
            ]
        })
    })
    test("unauth for wrong user", async()=>{
        const resp = await request(app)
            .get(`/users/u1/decks/${deckId}/cards`)
            .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toEqual(401)
    })
    test("unauth for anon", async()=>{
        const resp = await request(app)
            .get(`/users/u1/decks/${deckId}/cards`)
        expect(resp.statusCode).toEqual(401)
    })
    test("not found if bad deckId", async()=>{
        const resp = await request(app)
            .get(`/users/u1/decks/${0}/cards`)
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(404)
    })
})
/**************************** PATCH   /users/:username/decks/:deckId/cards  */
describe("PATCH /users/:username/decks/:deckId/cards", ()=>{
    let deckId, cards, deckCards;
    const nonExistent = [{ cardId: "b4fbaee3-a10f-4b2d-b07e-d041a96a7e27", quantity: 10 }]
    beforeAll(async ()=>{
        const deckResp = await db.query(`SELECT id FROM decks WHERE deck_owner = $1`, ["u1"])
        deckId = deckResp.rows[0].id
        const cardsResp = await db.query(`
            SELECT card_id AS "cardId", quantity
            FROM cards WHERE deck_id = $1`,
        [deckId])
        cards = cardsResp.rows.map(c => ({...c, quantity: 10}))
        deckCards = [ ...nonExistent, ...cards]
    
    })

    test("works for admin", async()=>{
        const resp = await request(app)
            .patch(`/users/u1/decks/${deckId}/cards`)
            .send({ deckCards })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body.cards.rejectedData.length).toEqual(nonExistent.length)
        expect(resp.body.cards.updated.length).toEqual(cards.length)
        expect(resp.body.cards.rejectedData).toEqual(nonExistent)
    })

    test("works for correct user", async()=>{
        const resp = await request(app)
            .patch(`/users/u1/decks/${deckId}/cards`)
            .send({ deckCards })
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body.cards.rejectedData.length).toEqual(nonExistent.length)
        expect(resp.body.cards.updated.length).toEqual(cards.length)
        expect(resp.body.cards.rejectedData).toEqual(nonExistent)
    })
    test("unauth for wrong user", async()=>{
        const resp = await request(app)
            .patch(`/users/u1/decks/${deckId}/cards`)
            .send({ deckCards })
            .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toEqual(401)
    })
    test("unauth for anon", async()=>{
        const resp = await request(app)
            .patch(`/users/u1/decks/${deckId}/cards`)
            .send({ deckCards })
        expect(resp.statusCode).toEqual(401)
    })
    test("works: attempts to update nonExistent cards", async()=>{
        const resp = await request(app)
            .patch(`/users/u1/decks/${deckId}/cards`)
            .send({ deckCards: nonExistent })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body.cards).toEqual({
            rejectedData: nonExistent,
            updated: []
        })
    })
    test("bad request if invalid deckCards", async()=>{
        const resp = await request(app)
            .patch(`/users/u1/decks/${deckId}/cards`)
            .send({ deckCards: 5 })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(400)
    })
    test("bad request if no data", async()=>{
        const resp = await request(app)
            .patch(`/users/u1/decks/${deckId}/cards`)
            .send({  })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(400)
    })
    test("not found if invalid deckId", async()=>{
        const resp = await request(app)
            .patch(`/users/u1/decks/${0}/cards`)
            .send({ deckCards })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(404)
    })
})
/**************************** DELETE  /users/:username/decks/:deckId/cards  */
describe("DELETE /users/:username/decks/:deckId/cards", ()=>{
    let deckId, cardIds;
    beforeAll(async ()=>{
        const deckResp = await db.query(`SELECT id FROM decks WHERE deck_owner = $1`,
        ["u1"])
        deckId = deckResp.rows[0].id
        const cardsResp = await db.query(`SELECT card_id FROM cards WHERE deck_id = $1`,
        [deckId])
        cardIds = cardsResp.rows.map(c => c.card_id)
    })
    const nonExistent = "b4fbaee3-a10f-4b2d-b07e-d041a96a7e27";

    test("works for admin", async()=>{
        const resp = await request(app)
            .delete(`/users/u1/decks/${deckId}/cards`)
            .send({
                cardIds: [ cardIds[0], cardIds[1] ]
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body).toEqual({
            deleted: [ cardIds[0], cardIds[1] ]
        })
    })
    test("works for correct user", async()=>{
        const resp = await request(app)
            .delete(`/users/u1/decks/${deckId}/cards`)
            .send({
                cardIds: [ cardIds[0], cardIds[1] ]
            })
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body).toEqual({
            deleted: [ cardIds[0], cardIds[1] ]
        })
    })
    test("unauth for wrong user", async()=>{
        const resp = await request(app)
            .delete(`/users/u1/decks/${deckId}/cards`)
            .send({
                cardIds: [ cardIds[0], cardIds[1] ]
            })
            .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toEqual(401)
    })
    test("unauth for anon", async()=>{
        const resp = await request(app)
            .delete(`/users/u1/decks/${deckId}/cards`)
            .send({
                cardIds: [ cardIds[0], cardIds[1] ]
            })
        expect(resp.statusCode).toEqual(401)
    })
    test(`accepts any valid UUID`, async()=>{
        const resp = await request(app)
            .delete(`/users/u1/decks/${deckId}/cards`)
            .send({
                cardIds: [ nonExistent ]
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body).toEqual({
            deleted: [ nonExistent ]
        })
    })
    test("bad request if any cardId is not a valid UUID", async()=>{
        const resp = await request(app)
            .delete(`/users/u1/decks/${deckId}/cards`)
            .send({
                cardIds: [ ...cardIds, "nope" ]
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(400)
    })
    test("bad request if missing data", async()=>{
        const resp = await request(app)
            .delete(`/users/u1/decks/${deckId}/cards`)
            .send({})
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(400)
    })
    test("bad request if empty cardIds", async()=>{
        const resp = await request(app)
            .delete(`/users/u1/decks/${deckId}/cards`)
            .send({ cardIds: [] })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(400)
    })
})











    