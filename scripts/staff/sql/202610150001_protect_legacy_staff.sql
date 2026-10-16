-- Payload accesses this table through the server's Postgres connection.
-- Browser/API roles must never read or modify legacy staff credentials.
BEGIN;
SET LOCAL lock_timeout = '5s';
REVOKE ALL PRIVILEGES ON TABLE public.users FROM anon, authenticated, PUBLIC;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
COMMIT;
