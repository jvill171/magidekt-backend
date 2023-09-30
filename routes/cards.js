"use strict";

/** Routes for cards. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureCorrectUserOrAdmin, ensureAdmin, ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const Card = require("../models/card");
const cardNewSchema = require("../schemas/card/cardNew.json");
const cardUpdateSchema = require("../schemas/card/cardUpdate.json");

const router = express.Router();

/** POST / { card }  => { card }
 *
 * Adds a new card. 
 *
 * This returns the newly created card:
 *  card: { cardUUID, name, typeLine, manaCost, colorId, imgCDN, imgTimestamp }
 *
 * Authorization required: Logged In
 **/

router.post("/", ensureLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, cardNewSchema);
        console.log("SCHEMA SUCCESS")
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        console.log("VALIDATED")
        const card = await Card.add(req.body);
        console.log("ADDED")

        return res.status(201).json({ card });
    } catch (err) {
        return next(err);
    }
});


/** GET / { limit, page } => { cards: [ {username, displayName, email, isAdmin }, ... ] }
 *
 * Returns list of all cards, paginated.
 *
 * Default limit = 50, default page = 1
 * 
 * Authorization required: admin
 **/

router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const cards = await Card.findAll();
    return res.json({ cards });
  } catch (err) {
    return next(err);
  }
});

/** GET /[cardUUID] => { card }
 *
 * Returns { cardUUID, name, typeLine, manaCost, colorId, imgCDN, imgTimestamp }
 *
 * Authorization required: Logged In
 **/

router.get("/:cardUUID", ensureLoggedIn, async function (req, res, next) {
  try {
    const user = await Card.get(req.params.cardUUID);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[cardUUID] { card } => { card }
 *
 * Data can include:
 *   { name, typeLine, manaCost, colorId, imgCDN, imgTimestamp }
 *
 * Returns { cardUUID, name, typeLine, manaCost, colorId, imgCDN, imgTimestamp }
 *
 * Authorization required: admin 
 **/

router.patch("/:cardUUID", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, cardUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const card = await Card.update(req.params.cardUUID, req.body);
    return res.json({ card });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[cardUUID]  =>  { deleted: cardUUID }
 * 
 * Note: May be unable to delete a card directly if it is actively being used in a deck
 *
 * Authorization required: admin
 **/

router.delete("/:cardUUID", ensureAdmin, async function (req, res, next) {
  try {
    await Card.remove(req.params.cardUUID);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
