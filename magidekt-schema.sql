-- Create the 'users' table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(20) NOT NULL,
  password TEXT NOT NULL,
  email TEXT NOT NULL
    CHECK (position('@' IN email) > 1),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create enum for format (used in decks)
CREATE TYPE deck_formats AS ENUM (
    'standard', 'future', 'historic', 'gladiator', 'pioneer', 'explorer',
    'modern', 'legacy', 'pauper', 'vintage', 'penny', 'commander',
    'oathbreaker', 'brawl', 'historicbrawl', 'alchemy', 'paupercommander',
    'duel', 'oldschool', 'premodern', 'predh'
    );

-- Create the 'decks' table
CREATE TABLE decks (
  id SERIAL PRIMARY KEY,
  deck_name VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  format deck_formats,
  color_identity VARCHAR(5),
  tags jsonb,
  deck_owner INT NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE, 
  CONSTRAINT max_tags CHECK (jsonb_array_length(tags) <= 5)
);

-- Create the 'cards' table
CREATE TABLE cards (
  card_uuid UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type_line TEXT NOT NULL,
  mana_cost TEXT NOT NULL,
  color_id VARCHAR(5),
  img_cdn VARCHAR(10) NOT NULL,
  img_timestamp BIGINT NOT NULL
);

-- Create the 'deck_cards' table
CREATE TABLE decks_cards (
  deck_id INT
    REFERENCES decks(id)
    ON DELETE CASCADE,
  card_id UUID
    REFERENCES cards(card_uuid),
  quantity NUMERIC NOT NULL DEFAULT 1,
  PRIMARY KEY (deck_id, card_id)
);
