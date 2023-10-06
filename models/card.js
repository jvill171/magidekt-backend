"use strict";

const db = require("../db");
const { sqlForBulkInsertQuery } = require("../helpers/sql");
const { NotFoundError } = require("../expressError");
const { validateCardIDs } = require("../helpers/validateCardIDs.js")

class Card{

  /** Add new cards based on a list of cards.
   *      deckCards: [{cardId, quantity}, ...]
   *
   * Returns cards:{ rejectedData, added }
   *    where both rejectedData & added are: [ {cardId, quantity}, ... ]
   * 
   * Throws NotFoundError if deck not found.
   **/
  
  static async add( deckId, {deckCards} ) {
    // Ensure valid deckId
    const deckRes = await db.query(
      `SELECT id FROM decks WHERE id = $1`, [deckId]
      );
    const validDeck = deckRes.rows[0]
    if(!validDeck) throw new NotFoundError(`No deck: ${deckId}`);

    // Get list of existing cards in deck
    const existingRes = await db.query(
      `SELECT card_id FROM cards WHERE deck_id = $1`, [deckId]
    )
    const existingCards = existingRes.rows.map(c => c.card_id);
    
    //Filter deckCards into 2 arrays, toAdd & toExclude
    const toAdd = deckCards.filter(card => !existingCards.includes(card.cardId));
    const toExclude = deckCards.filter(card => existingCards.includes(card.cardId));
    
    const {not_found, found} = await validateCardIDs(toAdd)
    not_found.push(...toExclude)

    const cards = {
      rejectedData: not_found,
             added: found
    }
    if(found.length > 0){
      // Build query components
      const main_vals = cards.added.map(c =>[deckId, c.cardId, c.quantity])
      const main_ph = sqlForBulkInsertQuery(main_vals);
      const main_sqlQuery =
        `INSERT INTO cards (deck_id, card_id, quantity)
         VALUES ${main_ph}
         RETURNING card_id AS "cardId",
                   quantity`
      
      const addedRes = await db.query(main_sqlQuery, [...main_vals.flat()]);
      // Overwrite cards.added to ensure return data accuracy
      cards.added = addedRes.rows;  
    }

    return cards
  }

  /** Find all cards from deck with [deckId].
   *
   * Returns [ {cardId, quantity}, ... ]
   * 
   * Throws NotFoundError if deck not found.
   **/
  
  static async get(deckId) {
    // Ensure valid deckId
    const deckRes = await db.query(
      `SELECT id FROM decks WHERE id = $1`, [deckId]
      );
    const validDeck = deckRes.rows[0]
    if(!validDeck) throw new NotFoundError(`No deck: ${deckId}`)

    const result = await db.query(
      `SELECT card_id AS "cardId",
              quantity
        FROM cards
        WHERE deck_id = $1`,[deckId]
    );
    return result.rows;
  }

  /** Find all cards in all decks
   *
   * Returns allCards: [ {cardId, quantity}, ... ]
   *
   * Throws NotFoundError if no cards.
   **/
  static async findAll() {
    const cardRes = await db.query(
      `SELECT deck_id AS "deckId"
              card_id AS "cardId",
              quantity
       FROM cards`,
    );

    const allCards = cardRes.rows;

    if (allCards.length < 1) throw new NotFoundError(`No cards in DB`);

    return allCards;
  }
  
  
  /** Update Cards with {deckCards}.
   *
   * deckCards is [{cardId, quantity}, ...]
   *
   * Returns cards: { rejectedData, updated }
   *    where both rejectedData & updated are: [{cardId, quantity}, ...]
   *
   * Throws NotFoundError if deck not found.
   */
  static async update(deckId, {deckCards}) {
    // Ensure valid deckId
    const deckRes = await db.query(`SELECT id FROM decks WHERE id = $1`, [deckId]);
    const validDeck = deckRes.rows[0]
    if(!validDeck) throw new NotFoundError(`No deck: ${deckId}`);

    // Get list of existing cards in deck
    const existingRes = await db.query(
      `SELECT card_id FROM cards WHERE deck_id = $1`, [deckId]
    )
    const existingCards = existingRes.rows.map(c => c.card_id);
    
    //Filter deckCards into 2 arrays, rejectedData & toUpdate
    const rejectedData = deckCards.filter(card => !existingCards.includes(card.cardId));
    const toUpdate = deckCards.filter(card => existingCards.includes(card.cardId));
    
    const cards = {  rejectedData, updated: toUpdate }

    if(toUpdate.length > 0){
      const cases = toUpdate.map((_, idx) =>
          `WHEN card_id = $${2*idx + 1} THEN $${2*idx + 2}`);
      // Build query components
      const ph_IDs = toUpdate.map((_, idx) =>
          `$${ (2 * cases.length) + (idx + 1)}`) 
      const ph_deckID = `$${ (2 * cases.length) + (ph_IDs.length + 1)}`
      const sqlCases = cases.join("\n")
      // Build query values 
      const values     = toUpdate.flatMap(c => [c.cardId, c.quantity])
      const cardIdList = toUpdate.flatMap(c => [c.cardId])
      values.push(...cardIdList)
      // Build query
      const querySql =
        `UPDATE cards
         SET quantity = 
         CASE
          ${sqlCases}
         ELSE quantity
         END
         WHERE card_id IN (${ph_IDs})
         AND deck_id = ${ph_deckID}
         RETURNING card_id AS "cardId",
                   quantity`;

      const updateRes = await db.query(querySql, [...values, deckId])
      // Overwrite cards.updated to ensure return data accuracy
      cards.updated = updateRes.rows
    }

    return cards;
}
  
  /** Delete one or more cards from a deck in the database;
   * 
   * returns undefined.
   * 
   * Throws NotFoundError if deck not found.
   * */

  static async remove(deckId, cardIds) {
    // Ensure valid deckId
    const deckRes = await db.query(`SELECT id FROM decks WHERE id = $1`, [deckId]);
    const validDeck = deckRes.rows[0]
    if(!validDeck) throw new NotFoundError(`No deck: ${deckId}`);

    // Do NOT check that every card being deleted exists
    // Instead, simply attempt to delete any cards anyways, even if invalid
    const ph_IDs = cardIds.map((_, idx)=> `$${idx + 1}`);

    const sqlQuery = 
      `DELETE from cards
       WHERE card_id IN (${ph_IDs})
       AND deck_id = $${cardIds.length + 1}
       RETURNING card_id AS "cardId"`

    await db.query( sqlQuery, [...cardIds, deckId])
  }
}


module.exports = Card;
