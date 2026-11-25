-- Removes personal tasks: the app now only tracks professional work.
-- Deletes every todo with type = 'personal' (their task relationships and
-- discussion links cascade), removes the "Personal" task-type setting, and makes
-- 'professional' the column default. Take a backup first. Safe to run more than once.
-- Apply with: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f script/sql/002-remove-personal-tasks.sql

BEGIN;

DELETE FROM todos WHERE type = 'personal';
DELETE FROM settings WHERE "group" = 'todo_type' AND value = 'personal';
ALTER TABLE todos ALTER COLUMN type SET DEFAULT 'professional';

COMMIT;
