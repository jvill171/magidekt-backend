"use strict";

const request = require("supertest");

const app = require("../app");
const User = require("../models/user");
const Deck = require("../models/deck");

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
    test("works 5", async()=>{
        expect(1).toEqual(1);
    })
})
/**************************** POST    /users/:username/decks/:deckId/cards  */
describe("POST /users/:username/decks/:deckId/cards", ()=>{
    test("works 6", async()=>{
        expect(1).toEqual(1);
    })
})
/**************************** GET     /users/:username/decks/:deckId/cards  */
describe("GET /users/:username/decks/:deckId/cards", ()=>{
    test("works 7", async()=>{
        expect(1).toEqual(1);
    })
})
/**************************** PATCH   /users/:username/decks/:deckId/cards  */
describe("PATCH /users/:username/decks/:deckId/cards", ()=>{
    test("works 8", async()=>{
        expect(1).toEqual(1);
    })
})
/**************************** DELETE  /users/:username/decks/:deckId/cards  */
describe("DELETE /users/:username/decks/:deckId/cards", ()=>{
    test("works 9", async()=>{
        expect(1).toEqual(1);
    })
})











    