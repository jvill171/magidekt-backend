-- both test users have the password "password"

INSERT INTO users (username, password, email, is_admin)
VALUES ('testuser',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        'testuser@magidekt.xyz',
        FALSE),
       ('testadmin',
        '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q',
        'testadmin@magidekt.xyz',
        TRUE);

INSERT INTO decks (deck_name, description, format, color_identity, tags, deck_owner)
VALUES  ('test_deck_1', 'test description of the deck known as test_deck_1',
         'commander', 'RGUBW','["Aggro", "Ramp", "Burn"]'::jsonb, 1),
        ('test_deck_2', 'test description of the deck known as test_deck_2',
         'standard', 'R','["Mill", "Token", "Tempo"]'::jsonb, 2),
        ('test_deck_2', 'test description of the deck known as test_deck_2',
         'standard', 'R','["Mill", "Token", "Tempo", "Superfriends", "Mill"]'::jsonb, 2);
         
-- LIST OF VALID TAGS, TO IMPLEMENT IN FRONTEND 
-- "Aggro", "Control", "Combo", "Midrange", "Ramp", "Burn", "Mill", "Token", "Voltron", "Tribal", "Reanimator", "Stax", "Superfriends", "Aristocrats","Land Destruction", "Tempo", "Prison", "Infect", "Storm" 


INSERT INTO cards (card_uuid, name, type_line, mana_cost, color_id, img_cdn, img_timestamp)
VALUES  ('9395fce4-11bf-4934-8323-5be4862c9779',
         'Radiating Lightning',
         'Instant',
         '{3}{R}', 'R', '9/3/', '1562302993'),

         ('c4e9995e-f26b-4638-b69d-a310f58f0331',
          'Ground Seal',
          'Enchantment',
         '{1}{G}', 'G', 'c/4/', '1592710917'),

         ('edd69ea7-aab6-4f30-98f4-640cb0a6046c',
          'Architects of Will',
          'Artifact Creature — Human Wizard',
         '{2}{U}{B}', 'BU', 'e/d/', '1562644950'),

         ('2d76b7e3-6890-4120-8575-732909c8bdff',
          'Lawbringer',
          'Creature — Kor Rebel',
         '{2}{W}', 'W', '2/d/', '1562629226');

INSERT INTO decks_cards (deck_id, card_id, quantity)
VALUES  (1,'9395fce4-11bf-4934-8323-5be4862c9779', 1), (1,'c4e9995e-f26b-4638-b69d-a310f58f0331', 2),
        (2,'edd69ea7-aab6-4f30-98f4-640cb0a6046c', 1), (2,'2d76b7e3-6890-4120-8575-732909c8bdff', 3), (2,'c4e9995e-f26b-4638-b69d-a310f58f0331', 10);