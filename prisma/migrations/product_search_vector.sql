-- Full-text search support for Product.
-- One-off SQL: apply via the Supabase SQL editor (or `psql "$DIRECT_URL" -f ...`).
-- This column is NOT represented in schema.prisma because Prisma does not
-- support generated tsvector columns. It is safe because `db push` never
-- drops columns that aren't in the schema without interactive confirmation,
-- and the column is read-only (the GENERATED clause keeps it in sync).

CREATE EXTENSION IF NOT EXISTS unaccent;

-- Drop any previous, non-generated, or differently-defined column so this
-- script stays idempotent across re-runs.
ALTER TABLE "Product" DROP COLUMN IF EXISTS search_vector;

ALTER TABLE "Product" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'spanish',
      coalesce(name, '') || ' ' || coalesce(description, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS product_search_vector_idx
  ON "Product" USING GIN (search_vector);
