"use strict";

/** Routes for decks. */

const jsonschema = require("jsonschema");

const express = require("express");
const { BadRequestError } = require("../expressError");
const Deck = require("../models/deck");
const Card = require("../models/card");
const deckNewSchema = require("../schemas/deck/deckNew.json");
const deckUpdateSchema = require("../schemas/deck/deckUpdate.json");
const cardsAddUpdateSchema = require("../schemas/card/cardsAddUpdate.json")
const cardsRemoveSchema = require("../schemas/card/cardsRemove.json")

/** ************************************************************************
 * NOTE: All routes are children of /users/[username]/decks route
 * 
 * All routes - Authorization required: CorrectUserOrAdmin
************************************************************************* */
const router = express.Router();

/** POST / { deckOwner, deck }  => { deck }
 *
 * Creates a new deck, with no cards. 
 *
 * This returns the newly created deck:
 *  deck: { deckName, description, format, colorIdentity, tags, deckOwner}
 * 
 * Authorization required: CorrectUserOrAdmin (from parent route)
 **/

router.post("/", async function (req, res, next) {
    try {
        // NOTE: deckNewSchema uses a pre-written list of ENUM. If the list
        // is ever updated on the DB, it should also be updated here to reflect this.
        const validator = jsonschema.validate(req.body, deckNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const deck = await Deck.createDeck(req.username, req.body);

        return res.status(201).json({ deck });
    } catch (err) {
        return next(err);
    }
});


/** GET / => { deckCollection: 
 * [ {id, deckName, description, format, colorIdentity, tags, displayName, cardCount}, ...] }
 * 
 * Retrieves a list of all of [username]'s decks
 * 
 * Authorization required:  CorrectUserOrAdmin (from parent route)
 **/

router.get("/", async function (req, res, next) {
  try {
    const deckCollection = await Deck.findUserDecks(req.username);
    return res.json({ deckCollection });
  } catch (err) {
    return next(err);
  }
});

/** GET /[deckId] => { deck }
 * 
 * Returns deck: {deckName, description, format, colorIdentity, tags, cards}
 *            Where cards is [ {cardId, quantity}, ... ]
 * 
 * Authorization required:  CorrectUserOrAdmin (from parent route)
 **/

router.get("/:deckId", async function (req, res, next) {
  try {
    const deck = await Deck.get(req.params.deckId, req.username);
    return res.json({ deck });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[cardUUID] { deckId, deck } => { deck }
 *
 * Data can include:
 *   { deckName, description, format, colorIdentity, tags }
 *
 * Returns deck: { id, deckName, description, format, colorIdentity, tags, deckOwner }
 *
 * Authorization required: CorrectUserOrAdmin (from parent route) 
 **/

router.patch("/:deckId", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, deckUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const deck = await Deck.update(req.params.deckId, req.body);
    return res.json({ deck });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /users/[username]/decks/[deckId] =>  { deleted: deckId }
 * 
 * Authorization required: CorrectUserOrAdmin (from parent route)
 **/

router.delete("/:deckId", async function (req, res, next) {
  try {
    await Deck.remove(req.params.deckId);
    return res.json({ deleted: req.params.deckId });
  } catch (err) {
    return next(err);
  }
});



/** *******************************************************************************
 * These next routes are related to adding/removing/modifying cards within
 * a specific deck
 ******************************************************************************* */



/** POST /[deckId]/cards
 *      { deckCards: [ {cardId, quantity}, ...] }  => { cards }
 * 
 * Adds new cards to a deck [deckId]. 
 *
 * Returns cards:{ rejectedData, added }
   *    where both rejectedData & added are: [ {cardId, quantity}, ... ]
 *
 * Authorization required: CorrectUserOrAdmin (from parent route)
 **/

router.post("/:deckId/cards", async function (req, res, next) {
  try {
      const validator = jsonschema.validate(req.body, cardsAddUpdateSchema);
      if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs);
      }
      const cards = await Card.add(req.params.deckId, req.body);

      return res.status(201).json({ cards });
  } catch (err) {
      return next(err);
  }
});

/** GET /[deckId]/
 *      { deckCards: [ {cardId, quantity}, ...] }  => { cards }
 * 
 * Simply returns all cards within a deck.
 * 
 * Returns
 *    cards: [ {cardId, quantity}, ... ]
 *      
 * Authorization required: CorrectUserOrAdmin (from parent route)
 **/

router.get("/:deckId/cards", async function (req, res, next) {
  try {
    const cards = await Card.get(req.params.deckId);
    return res.json({ cards });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[deckId]/
 * 
 * Update the quantity of each cards passed in:
 * 
 * Returns
 *    cards: { rejectedData, updated }
 *    where both rejectedData & updated are: [{cardId, quantity}, ...]
 * 
 * Authorization required: CorrectUserOrAdmin (from parent route)
 **/

router.patch("/:deckId/cards", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, cardsAddUpdateSchema);
    if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
    }
    const cards = await Card.update(req.params.deckId, req.body);
    return res.status(201).json({ cards });
  } catch (err) {
    return next(err);
  }
});
/** DELETE /[deckId]/cards  {cardIds} => deleted: [cardIds]
 *    where cardIds is an array of cardIds like:
 *    cardIds:[id, id, id]
 * 
 * Delete each card passed in from deck [deckId]
 * 
 * Returns
 *    deleted: [ {cardId}, ... ]
 * 
 * Authorization required: CorrectUserOrAdmin (from parent route)
 **/

router.delete("/:deckId/cards", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, cardsRemoveSchema);
    if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
    }

    await Card.remove(req.params.deckId, req.body.cardIds);
    return res.json({ deleted: req.body.cardIds });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
