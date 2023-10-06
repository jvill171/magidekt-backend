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
| <span style="color:#0074cc">**POST**</span>   | `/users/:username/decks/:deckId/cards` | Correct User or Admin    | Get cards in a specific deck           |
| <span style="color:#0074cc">**POST**</span>   | `/users/:username/decks/:deckId/cards` | Correct User or Admin    | Add cards to a specific deck           |
| <span style="color:#ff9c33">**PATCH**</span>  | `/users/:username/decks/:deckId/cards` | Correct User or Admin    | Update existing cards in a specific deck |
| <span style="color:#ff0000">**<span style="color:#ff5f5f">**DELETE**</span>**</span> | `/users/:username/decks/:deckId/cards` | Correct User or Admin    | Remove cards from a specific deck      |
