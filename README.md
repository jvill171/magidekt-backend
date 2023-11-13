# Capstone Project - Magidekt
This project is a Magic The Gathering deck-builder inspired by [Archidekt](https://archidekt.com/) and uses the [Scryfall API](https://scryfall.com/docs/api).

This is the Backend for this project.  
The Frontend for this project can be found [here](https://github.com/jvill171/magidekt-frontend).

## Schema
My Schema file can be seen here: [magidekt-schema](https://github.com/jvill171/magidekt-backend/blob/main/magidekt-schema.sql)

Here's an illustration of my schema:  
![Schema Diagram](./images/schema.png)

## ROUTES

| Method | Endpoint                             | Authentication            | Description                           |
|--------|--------------------------------------|----------------------------|---------------------------------------|
| <span style="color:#0074cc">**POST**</span>   | `/auth/token`                        | -                          | Login                                 |
| <span style="color:#0074cc">**POST**</span>   | `/auth/register`                     | -                          | Register                              |
| <span style="color:green">**GET**</span>    | `/decks`                             | -                          | Get all decks in DB (Paginated)       |
| <span style="color:green">**GET**</span>    | `/decks/deck_formats`                     | Login                      | Get a list of all valid **format** for a deck    |
| <span style="color:green">**GET**</span>    | `/decks/:deckId`                     | Login                      | Get a specific deck                   |
| <span style="color:green">**GET**</span>    | `/users`                             | Admin                      | Get all users                         |
| <span style="color:#0074cc">**POST**</span>   | `/users`                             | Admin                      | Create a user account                 |
| <span style="color:green">**GET**</span>    | `/users/:username`                   | Correct User or Admin      | Get a specific user account           |
| <span style="color:#ff9c33">**PATCH**</span>  | `/users/:username`                   | Correct User or Admin      | Update user account                   |
| <span style="color:#ff0000">**<span style="color:#ff5f5f">**DELETE**</span>**</span> | `/users/:username`                   | Correct User or Admin      | Delete user account                   |
| <span style="color:green">**GET**</span>    | `/users/:username/decks/`            | Login                      | Get all decks by a specific user      |
| <span style="color:#0074cc">**POST**</span>   | `/users/:username/decks/`            | Correct User or Admin      | Create an empty deck                   |
| <span style="color:green">**GET**</span>    | `/users/:username/decks/:deckId`     | Login                      | Get a specific deck, including its cards |
| <span style="color:#ff9c33">**PATCH**</span>  | `/users/:username/decks/:deckId`     | Correct User or Admin      | Update deck details, excluding cards   |
| <span style="color:#ff0000">**<span style="color:#ff5f5f">**DELETE**</span>**</span> | `/users/:username/decks/:deckId`     | Correct User or Admin      | Remove a specific deck                 |
| <span style="color:green">**GET**</span>   | `/users/:username/decks/:deckId/cards` | Correct User or Admin    | Get cards in a specific deck           |
| <span style="color:#0074cc">**POST**</span>   | `/users/:username/decks/:deckId/cards` | Correct User or Admin    | Add cards to a specific deck           |
| <span style="color:#ff9c33">**PATCH**</span>  | `/users/:username/decks/:deckId/cards` | Correct User or Admin    | Update existing cards in a specific deck |
| <span style="color:#ff0000">**<span style="color:#ff5f5f">**DELETE**</span>**</span> | `/users/:username/decks/:deckId/cards` | Correct User or Admin    | Remove cards from a specific deck      |


# Future Plans & Noteworthy Code
There are a few notable oddities in some areas of my backend code. I plan to fix these issues, but due to time constraints, I left them as they were for the time being.

### Routes
- In the `app.js` file, the following code can be seen:
  ```js
  app.use("/users", usersRoutes); // Has child routes app.use("/:username/decks")
  ```
  and within the `routes/users.js` file is the following code:
  ```js
  // userDecks routes 
  router.use("/:username/decks", ensureCorrectUserOrAdmin, passUsername, decksRoutes);
  ```
  This was strucutred this way mainly to shorten the length of the routes within the `/:username/decks` route, as I wanted the username and deckId to be within the endpoint, however, as a result, a middleware function `middleware/passUsername.js` was necessary to use the username from the `req.params`.

  I plan to fix this in the future, allowing other middleware to be used more freely outside of `ensureCorrectUserOrAdmin`.
- The `/routes/deckDiscovery.js` routes file does not have a test file associated with it. This was done due to time constraints and the fact that none of its routes have yet been implemented on my frontend. I plan to write tests for these routes in the future.

### Models
- While the `user` & `deck` models take in a single object with all the data they need, the `card` model takes in an object with an array of objects. This is done to recduce the amount of API calls made by taking data in bulk rather than many single API calls for each individual card. As such, the queries for the `card` model also handle data in bulk & are generally more forgiving if certain cards are not found.

- In the `models/card.js` models, the `.update()` method will be cleaned up a bit. Currenlty, toUpdate is looped through multiple times over, but this may be fixable with a `.reduce()` or other loop code refactor. I plan to do this in the future, which should help with code readablity
    ```js
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
    ```