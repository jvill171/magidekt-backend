const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM decks");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");

  // Create users
  await db.query(`
        INSERT INTO users(username,
                          display_name,
                          password,
                          email,
                          is_admin)
        VALUES ('u1', 'U1', $1, 'u1@email.com', false),
               ('u2', 'U2', $2, 'u2@email.com', true)
        RETURNING username`,
      [
        await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
        await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
      ]);

  // Create (empty) decks
  const decksIDs = await db.query(`
        INSERT INTO decks(deck_name,
                          description,
                          format,
                          color_identity,
                          tags,
                          deck_owner)
        VALUES ('d1', 'desc1', 'standard', 'WUBRG', '["D1t1"]'::jsonb, 'u1' ),
              ('d2', '', 'gladiator', '', '[]'::jsonb, 'u1' ),
              ('d3', 'desc3', 'commander', 'WUG', '["D3t1", "D3t2"]'::jsonb, 'u2' )
        RETURNING id`, []
      );

await db.query(`
      INSERT INTO cards(deck_id,
                        card_id,
                        quantity)
      VALUES ( $1,'9395fce4-11bf-4934-8323-5be4862c9779', 1 ),
             ( $1,'c4e9995e-f26b-4638-b69d-a310f58f0331', 10 ),
             ( $1,'edd69ea7-aab6-4f30-98f4-640cb0a6046c', 11 ),
             
             ( $2,'c4e9995e-f26b-4638-b69d-a310f58f0331', 2 ),
             ( $2,'edd69ea7-aab6-4f30-98f4-640cb0a6046c', 20 ),
             
             ( $3,'2d76b7e3-6890-4120-8575-732909c8bdff', 3 ),
             ( $3,'c4e9995e-f26b-4638-b69d-a310f58f0331', 30 )
      RETURNING deck_id, card_id, quantity`,
      [
        decksIDs.rows[0].id,
        decksIDs.rows[1].id,
        decksIDs.rows[2].id,
      ]);
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


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
};