"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Deck = require("../models/deck");
const Card = require("../models/card");
const { createToken } = require("../helpers/tokens");


async function commonBeforeAll() {
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM cards");
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM decks");
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM users");


// USERS
    await User.register({
        username: "u1",
        email: "user1@user.com",
        password: "password1",
        isAdmin: false,
    });
    await User.register({
        username: "u2",
        email: "user2@user.com",
        password: "password2",
        isAdmin: false,
    });
    await User.register({
        username: "admin",
        email: "admin@user.com",
        password: "password3",
        isAdmin: true,
    });

// DECKS
    const deck1 = await Deck.createDeck( "u1", {
        deckName: "d1", 
        format: "standard", 
    })
    const deck2 = await Deck.createDeck( "u1", {
        deckName: "d2", 
        format: "commander", 
    })
    const deck3 = await Deck.createDeck( "u2", {
        deckName: "d3", 
        format: "standard", 
    })

// CARDS

    await Card.add( deck1.id,
        {
            deckCards:[
                { cardId: '9395fce4-11bf-4934-8323-5be4862c9779', quantity: 1 },
                { cardId: 'c4e9995e-f26b-4638-b69d-a310f58f0331', quantity: 1 },
                { cardId: 'edd69ea7-aab6-4f30-98f4-640cb0a6046c', quantity: 1 },
                { cardId: '2d76b7e3-6890-4120-8575-732909c8bdff', quantity: 1 },
            ]
        })
    await Card.add( deck3.id,
        {
            deckCards:[
                { cardId: '9395fce4-11bf-4934-8323-5be4862c9779', quantity: 2 },
                { cardId: 'c4e9995e-f26b-4638-b69d-a310f58f0331', quantity: 2 },
                { cardId: 'edd69ea7-aab6-4f30-98f4-640cb0a6046c', quantity: 2 },
                { cardId: '2d76b7e3-6890-4120-8575-732909c8bdff', quantity: 2 },
            ]
        })
}

async function commonBeforeEach() {
    await db.query("BEGIN");
}

async function commonAfterEach() {
    await db.query("ROLLBACK");
}

async function commonAfterAll() {
    await db.end();
}


const u1Token = createToken({ username: "u1", isAdmin: false });
const u2Token = createToken({ username: "u2", isAdmin: false });
const adminToken = createToken({ username: "admin", isAdmin: true });


module.exports = {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    u2Token,
    adminToken,
};