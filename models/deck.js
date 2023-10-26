"use strict";

const db = require("../db");
const { sqlForPartialQuery } = require("../helpers/sql");
const { NotFoundError } = require("../expressError");

class Deck{

    /** Create a new, empty, deck.
     *
    * Returns { deckName, description, format, colorIdentity, tags, deckOwner}
    * 
    **/
  
  static async createDeck( deckOwner, deckData) {
    // Ensure the owner exists
    const ownerRes = await db.query(
      `SELECT username
       FROM users
       WHERE username = $1`, [deckOwner]
    )
    const foundOwner = ownerRes.rows[0];

    if (!foundOwner) throw new NotFoundError(`No user: ${deckOwner || ""}`);

    const {deckName, description, format, colorIdentity, tags} = deckData
    // Create new deck in db
    const result = await db.query(
      `INSERT INTO decks
        (deck_name, description, format, color_identity, tags, deck_owner)
       VALUES($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING id,
                 deck_name AS "deckName",
                 description,
                 format,
                 color_identity AS "colorIdentity",
                 tags,
                 deck_owner AS "deckOwner"`,
       [deckName, description, format, colorIdentity, JSON.stringify(tags), deckOwner]);

    const deck = result.rows[0];
    return deck;

  }

  /** Find all decks in DB.
   *
   * Returns { totalPages, currentPage, totalDecks, decks }
   *    where decks: [
   * {id, deckName, description, format, colorIdentity, tags}, ...
   * ]
   * 
   **/
  
  static async findAllDecks({page}) {
    const offsetVal = (page - 1) * 50;
    const result = await db.query(
        `SELECT id,
                deck_name AS "deckName",
                description,
                format,
                color_identity AS "colorIdentity",
                tags
            FROM decks
            ORDER BY deck_name
            OFFSET $1
            LIMIT 50`, [offsetVal]
    );
    const decks = result.rows;

    if(decks.length < 1) throw new NotFoundError(`No decks found`)

    const countRes = await db.query(`SELECT COUNT(*) FROM decks`);
    const totalDecks = countRes.rows[0].count;
    const pageCount = Math.floor((totalDecks-1) / 50) + 1;

    return {
      totalPages: pageCount,
      currentPage: page,
      totalDecks,
      decks
    }
  }

  /** Find all decks owned by [username].
   *
   * Returns [{id, deckName, description, format, colorIdentity, tags, displayName, cardCount}, ...]
   * 
   **/
  
  static async findUserDecks(username) {
    const result = await db.query(
      `SELECT d.id,
              d.deck_name AS "deckName",
              d.description,
              d.format,
              d.color_identity AS "colorIdentity",
              d.tags,
              u.display_name AS "displayName",
      COUNT(c.card_id) AS "cardCount"
      FROM decks d
      JOIN users u ON d.deck_owner = u.username
      LEFT JOIN cards c ON d.id = c.deck_id
      WHERE d.deck_owner = $1
      GROUP BY d.id, u.display_name
      ORDER BY d.deck_name`,
      [username]);

    return result.rows;
  }


  /** Given some id, return data on a specific deck.
   * 
   * OPTIONAL parameter owner
   * When owner is provided, further filters to ensure deck belongs to specified owner
   *
   * Returns deck: {id, deckName, description, format, colorIdentity, tags, cards }
   *    where cards is [ {cardId, quantity}, ... ]
   *
   * Throws NotFoundError if user not found.
   **/
  static async get(id, owner=undefined) {
    let sqlQuery =
      `SELECT id,
          deck_name AS "deckName",
          description,
          format,
          color_identity AS "colorIdentity",
          tags
      FROM decks
      WHERE id = $1`
    if(owner) sqlQuery += ` AND deck_owner = $2`;
    const qVals = owner ? [id, owner] : [id];

    const cardRes = await db.query( sqlQuery, [...qVals]);
    const deck = cardRes.rows[0];
    
    if(!deck){
      const message = owner
        ? `No deck found with owner: ${owner}`
        : `No deck found with id: ${id}`
      throw new NotFoundError(message)
    }

    // If a deck exists, get its cards
    const cards = await db.query(
        `SELECT card_id AS "cardId",
                quantity
        FROM cards
        WHERE deck_id = $1`, [deck.id]
    );

    // Add cards to the deck before return
    deck.cards = cards.rows

    return deck;
  }
  
  
  /** Update data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { deckName, description, format, colorIdentity, tags, deckOwner }
   *
   * Returns { id, deckName, description, format, colorIdentity, tags, deckOwner }
   *
   * Throws NotFoundError if not found.
   */
static async update(deckId, data) {
    const { setCols, values } = sqlForPartialQuery(
        data,
        {
          deckName: "deck_name",
          colorIdentity: "color_identity",
          deckOwner: "deck_owner"
        });

    const id_VarIdx = "$" + (values.length + 1);
    const querySql = 
        `UPDATE decks
         SET ${setCols}
         WHERE id = ${id_VarIdx}
         RETURNING  id,
                    deck_name AS "deckName",
                    description,
                    format,
                    color_identity AS "colorIdentity",
                    tags,
                    deck_owner AS "deckOwner"`;

    const result = await db.query(querySql, [...values, deckId]);
    const deck = result.rows[0];

    if (!deck) throw new NotFoundError(`No deck with id: ${deckId}`);

    return deck;
  }

  /** Delete given deck from database; returns undefined. */

  static async remove(id) {

    let result = await db.query(
      `DELETE
       FROM decks
       WHERE id = $1
       RETURNING id`, [id]
    );

    const deck = result.rows[0];

    if (!deck) throw new NotFoundError(`No deck with id: ${id}`);
  }

  
  /** Returns an array of all valid deck_formats
   *
   * Throws NotFoundError if no deck_formats found.
   */

  static async getDeckFormats() {

    let result = await db.query(
      `SELECT enumlabel
       FROM pg_enum
       WHERE enumtypid = 'deck_formats'::regtype;`
      );

    const formats = result.rows.map(f => f.enumlabel);

    if(!formats) throw new NotFoundError(`No deck_formats exist`)

    return formats;
  }

}


module.exports = Deck;
