-- Adds Strategic Impact + Estimated Hours to todos, and URL slugs to colleagues.
-- Additive only: no existing column or row is changed. Safe to run more than once.
-- Apply with: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f script/sql/001-task-sizing-and-colleague-slugs.sql
-- Slugs for existing colleagues are filled in by the app on startup (storage.backfillColleagueSlugs).

BEGIN;

ALTER TABLE todos ADD COLUMN IF NOT EXISTS strategic_impact text;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS estimated_hours double precision;

ALTER TABLE colleagues ADD COLUMN IF NOT EXISTS slug text;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'colleagues_slug_unique') THEN
    -- Name matches what drizzle-kit generates for slug: text("slug").unique()
    ALTER TABLE colleagues ADD CONSTRAINT colleagues_slug_unique UNIQUE (slug);
  END IF;
END $$;

COMMIT;
