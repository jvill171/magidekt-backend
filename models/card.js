"use strict";

const db = require("../db");
const { sqlForPartialQuery } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

class Card{

  /** Add a new card.
   *
   * Returns { cardUUID, name, typeLine, manaCost, colorId, imgCDN, imgTimestamp }
   * 
   **/
  
  static async add(
      {cardUUID, name, typeLine, manaCost, colorId, imgCDN, imgTimestamp}) {
    const duplicateCheck = await db.query(
      `SELECT card_uuid
       FROM cards
       WHERE card_uuid = $1`,
    [cardUUID]);
    
    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate card_uuid: ${cardUUID}`);
    }
    
    const result = await db.query(
      `INSERT INTO cards
        (card_uuid, name, type_line, mana_cost, color_id, img_cdn, img_timestamp)
       VALUES($1, $2, $3, $4, $5, $6, $7)
       RETURNING card_uuid AS "cardUUID",
                 name,
                 type_line AS "typeLine",
                 mana_cost AS "manaCost",
                 color_id AS "colorId",
                 img_cdn AS "imgCDN",
                 img_timestamp AS "imgTimestamp"`,
       [cardUUID, name, typeLine, manaCost, colorId, imgCDN, imgTimestamp]);

    const card = result.rows[0];
    return card;
  }

  /** Find all cards.
   *
   * Returns [{ cardUUID, name, typeLine, manaCost, colorId, imgCDN, imgTimestamp }, ...]
   * 
   * Note: returns up to 50 results by default, paginated
   **/
  
  static async findAll(limit=50, page=1) {
    const maxCards = await db.query( `SELECT COUNT(*) FROM cards`);
    const maxPages = (maxCards / limit);
    if(page > maxPages) throw NotFoundError(`No more cards on page`, page)

    const cardOffset = (page - 1) * limit;
    const result = await db.query(
      `SELECT card_uuid AS "cardUUID",
              name,
              type_line AS "typeLine",
              mana_cost AS "manaCost",
              color_id AS "colorId",
              img_cdn AS "imgCDN",
              img_timestamp AS "imgTimestamp"
        FROM cards
        ORDER BY name
        LIMIT $1
        OFFSET $2;`,[limit, cardOffset]
    );
    return result.rows;
  }

  /** Given some cardUUID, return data on that card.
   *
   * Returns { cardUUID, name, typeLine, manaCost, colorId, imgCDN, imgTimestamp }
   *
   * Throws NotFoundError if user not found.
   **/
  static async get(cardUUID) {
    const cardRes = await db.query(
      `SELECT card_uuid AS "cardUUID",
              name,
              type_line AS "typeLine",
              mana_cost AS "manaCost",
              color_id AS "colorId",
              img_cdn AS "imgCDN",
              img_timestamp AS "imgTimestamp"
      FROM cards
      WHERE card_uuid = $1`, [cardUUID]
    );

    const card = cardRes.rows[0];

    if (!card) throw new NotFoundError(`No card with cardUUID: ${cardUUID}`);

    return card;
  }
  
//   /** Update data with `data`.
//    *
//    * This is a "partial update" --- it's fine if data doesn't contain
//    * all the fields; this only changes provided ones.
//    *
//    * Data can include:
//    *   { name, typeLine, manaCost, colorId, imgCDN, imgTimestamp }
//    *
//    * Returns { cardUUID, name, typeLine, manaCost, colorId, imgCDN, imgTimestamp }
//    *
//    * Throws NotFoundError if not found.
//    */
  static async update(cardUUID, data) {
    const { setCols, values } = sqlForPartialQuery(
        data,
        {
          cardUUID: "card_uuid",
          typeLine: "type_line",
          manaCost: "mana_cost",
          colorId: "color_id",
          imgCDN: "img_cdn",
          imgTimestamp: "img_timestamp",
        });
    const cardUUID_VarIdx = "$" + (values.length + 1);
    const querySql = 
        `UPDATE cards 
         SET ${setCols} 
         WHERE card_uuid = ${cardUUID_VarIdx} 
         RETURNING card_uuid AS "cardUUID",
                   name,
                   type_line AS "typeLine",
                   mana_cost AS "manaCost",
                   color_id AS "colorId",
                   img_cdn AS "imgCDN",
                   img_timestamp AS "imgTimestamp"`;

    const result = await db.query(querySql, [...values, cardUUID]);
    const card = result.rows[0];

    if (!card) throw new NotFoundError(`No card with UUID: ${cardUUID}`);

    return card;
  }
  
  /** Delete given user from database; returns undefined. */

  static async remove(cardUUID) {
    // Check that card does not exist in another deck via decks_cards table
    let dependencyCheck = await db.query(
      `SELECT card_id AS "cardID"
       FROM decks_cards
       WHERE card_id = $1`, [cardUUID]
    )

    if (dependencyCheck.rows[0]) {
      throw new BadRequestError(`At least one deck is using card: ${cardUUID}`);
    }

    let result = await db.query(
      `DELETE
       FROM cards
       WHERE card_uuid = $1
       RETURNING card_uuid`, [cardUUID]
    );

    const card = result.rows[0];

    if (!card) throw new NotFoundError(`No card with UUID: ${cardUUID}`);
  }
}


module.exports = Card;
