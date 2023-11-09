"use strict";

const request = require("supertest");

const app = require("../app");
const User = require("../models/user")

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  adminToken,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** POST /users */
describe("POST /users", ()=>{
    test("works for admins: create non-admin", async ()=>{
        const resp = await request(app)
            .post("/users")
            .send({
                username: "newUser",
                password: "password",
                email:    "new@user.com",
                isAdmin:  false,
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            user:{
                username: "newUser",
                email:    "new@user.com",
                isAdmin:  false,
            }, token: expect.any(String),
        });
    });
    test("works for admins: create admin", async ()=>{
        const resp = await request(app)
            .post("/users")
            .send({
                username: "newAdmin",
                password: "password",
                email:    "new@user.com",
                isAdmin:  true,
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            user:{
                username: "newAdmin",
                email:    "new@user.com",
                isAdmin:  true,
            }, token: expect.any(String),
        });
    });

    test("unauth for users", async ()=>{
        const resp = await request(app)
            .post("/users")
            .send({
                username: "newAdmin",
                password: "password",
                email:    "new@user.com",
                isAdmin:  true,
            })
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toEqual(401);
    });
    test("unauth for anon", async ()=>{
        const resp = await request(app)
            .post("/users")
            .send({
                username: "newAdmin",
                password: "password",
                email:    "new@user.com",
                isAdmin:  true,
            })
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request if missing data", async ()=>{
        const resp = await request(app)
            .post("/users")
            .send({
                username: "newAdmin",
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(400);
    });
    test("bad request if invalid data", async ()=>{
        const resp = await request(app)
            .post("/users")
            .send({
                username: "newAdmin",
                password: "password",
                email:    "not-an-email",
                isAdmin:  true,
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(400);
    });
})
/************************************** GET /users */
describe("GET /users", ()=>{
    test("works for admins", async ()=>{
        const resp = await request(app)
            .get("/users")
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body).toEqual({
            users: [
                {
                  username: 'admin',
                  displayName: 'admin',
                  email: 'admin@user.com',
                  isAdmin: true
                },
                {
                  username: 'u1',
                  displayName: 'u1',
                  email: 'user1@user.com',
                  isAdmin: false
                },
                {
                  username: 'u2',
                  displayName: 'u2',
                  email: 'user2@user.com',
                  isAdmin: false
                }
              ]
        })
    })

    test("unauth for non-admin users", async ()=>{
        const resp = await request(app)
            .get("/users")
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toEqual(401)
    })
    test("unauth for anon", async ()=>{
        const resp = await request(app)
            .get("/users")
        expect(resp.statusCode).toEqual(401)
    })

    test("unauth for non-admin users", async ()=>{
        const resp = await request(app)
            .get("/users")
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toEqual(401)
    })
})

/************************************** GET /users/:username */
describe("GET /users/:username", ()=>{
    test("works for admin", async ()=>{
        const resp = await request(app)
            .get("/users/u1")
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body).toEqual({
            user: {
              username: 'u1',
              displayName: 'u1',
              email: 'user1@user.com',
              isAdmin: false,
              deckCount: '2'
            }
        })
    })
    test("works for same user", async ()=>{
        const resp = await request(app)
            .get("/users/u1")
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body).toEqual({
            user: {
              username: 'u1',
              displayName: 'u1',
              email: 'user1@user.com',
              isAdmin: false,
              deckCount: '2'
            }
        })
    })
    test("unauth for other user", async ()=>{
        const resp = await request(app)
            .get("/users/u1")
            .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toEqual(401)
    })
    test("unauth for other anon", async ()=>{
        const resp = await request(app)
            .get("/users/u1")
        expect(resp.statusCode).toEqual(401)
    })
    test("not found if user not found", async ()=>{
        const resp = await request(app)
            .get("/users/nope")
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(404)
    })
})
/************************************** PATCH /users/:username */
describe("PATCH /users/:username", ()=>{
    test("works for admin", async ()=>{
        const resp = await request(app)
            .patch("/users/u1")
            .send({
                displayName: "New"
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body).toEqual({
            user: {
              username: 'u1',
              displayName: 'New',
              email: 'user1@user.com',
              isAdmin: false
            }
        })
    })
    test("works for same user", async ()=>{
        const resp = await request(app)
            .patch("/users/u1")
            .send({
                displayName: "New"
            })
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body).toEqual({
            user: {
              username: 'u1',
              displayName: 'New',
              email: 'user1@user.com',
              isAdmin: false
            }
        })
    })
    test("unauth for other user", async ()=>{
        const resp = await request(app)
            .patch("/users/u1")
            .send({
                displayName: "New"
            })
            .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toEqual(401)
    })
    test("unauth for anon", async ()=>{
        const resp = await request(app)
            .patch("/users/u1")
            .send({
                displayName: "New"
            })
        expect(resp.statusCode).toEqual(401)
    })
    
    test("not found if no such user", async ()=>{
        const resp = await request(app)
            .patch("/users/nope")
            .send({
                displayName: "New"
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(404)
    })
    test("bad request if invalid data", async ()=>{
        const resp = await request(app)
            .patch("/users/u1")
            .send({
                displayName: 100
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(400)
    })
    
    test("works: can set new password", async ()=>{
        const resp = await request(app)
            .patch("/users/u1")
            .send({
                password: "password-new"
            })
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body).toEqual({
            user: {
              username: 'u1',
              displayName: 'u1',
              email: 'user1@user.com',
              isAdmin: false
            }
        })
        const isSuccessful = await User.authenticate("u1", "password-new");
        expect(isSuccessful).toBeTruthy();
    })
})

/************************************** DELETE /users/:username */
describe("DELETE /users/:username", ()=>{
    test("works for admin", async ()=>{
        const resp = await request(app)
            .delete("/users/u1")
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body).toEqual({ deleted: "u1" })
    })
    test("works for same user", async ()=>{
        const resp = await request(app)
            .delete("/users/u1")
            .set("authorization", `Bearer ${u1Token}`)
        expect(resp.body).toEqual({ deleted: "u1" })
    })
    test("unauth for other user", async ()=>{
        const resp = await request(app)
            .delete("/users/u1")
            .set("authorization", `Bearer ${u2Token}`)
        expect(resp.statusCode).toEqual(401)
    })
    test("unauth for anon", async ()=>{
        const resp = await request(app)
            .delete("/users/u1")
        expect(resp.statusCode).toEqual(401)
    })
    test("not found if user missing", async ()=>{
        const resp = await request(app)
            .delete("/users/nope")
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.statusCode).toEqual(404)
    })
})

