"use strict";

/** Routes for decks. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const Deck = require("../models/deck");
const deckPaginatedSchema = require("../schemas/deck/deckPaginated.json");

const router = express.Router();



/** GET / => { deckCollection: 
 *      [ {id, deckName, description, format, colorIdentity, tags}, ...] }
 * 
 * Retrieves a list of all decks in DB (50 at a time), paginated
 * 
 * Returns: { totalPages, currentPage, totalDecks, decks }
 *    where decks: [ {id, deckName, description, format, colorIdentity, tags}, ...]
 * 
 * Authorization required: None
 **/

router.get("/", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, deckPaginatedSchema);
    if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
    }
    const deckCollection = await Deck.findAllDecks(req.body);
    return res.json({ deckCollection });
  } catch (err) {
    return next(err);
  }
});

/** 
 * GET /[deckId] => { deck }
 * 
 * Returns deck: {deckName, description, format, colorIdentity, tags, cards}
 *            Where cards is [ {cardId, quantity}, ... ]
 * 
 * Authorization required: Logged in
 **/

router.get("/:deckId", ensureLoggedIn, async function (req, res, next) {
  try {
    const deck = await Deck.get(req.params.deckId);
    return res.json({ deck });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
