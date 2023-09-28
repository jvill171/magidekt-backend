\echo 'Delete and recreate magidekt db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE magidekt;
CREATE DATABASE magidekt;
\connect magidekt

\i magidekt-schema.sql
\i magidekt-seed.sql

\echo 'Delete and recreate magidekt_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE magidekt_test;
CREATE DATABASE magidekt_test;
\connect magidekt_test

\i magidekt-schema.sql
