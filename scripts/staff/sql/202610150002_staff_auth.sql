-- Additive preparation: existing Payload login and business policies are unchanged.
BEGIN;
CREATE SCHEMA IF NOT EXISTS aet_private;
REVOKE ALL ON SCHEMA aet_private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS aet_private.staff_accounts (
  legacy_user_id integer PRIMARY KEY REFERENCES public.users(id),
  email text NOT NULL UNIQUE CHECK (email = lower(btrim(email))),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id),
  migration_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  migration_state text NOT NULL DEFAULT 'pending'
    CHECK (migration_state IN ('pending', 'complete', 'recovery_only', 'blocked')),
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  offices text[] NOT NULL DEFAULT '{}',
  include_unassigned boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  migrated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE aet_private.staff_accounts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aet_private.staff_accounts FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS aet_private.auth_attempts (
  key text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 1,
  window_started_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE aet_private.auth_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aet_private.auth_attempts FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS aet_private.password_recovery (
  token_hash text PRIMARY KEY,
  legacy_user_id integer NOT NULL REFERENCES aet_private.staff_accounts(legacy_user_id),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);
ALTER TABLE aet_private.password_recovery ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aet_private.password_recovery FROM PUBLIC, anon, authenticated;

-- The owner approved these three existing accounts and office scopes on 2026-10-15.
-- A rerun never changes existing authorization or migration progress.
INSERT INTO aet_private.staff_accounts
  (legacy_user_id, email, role, offices, include_unassigned)
SELECT id, lower(btrim(email)),
  CASE WHEN email = 'tech@meiyugroup.org' THEN 'admin' ELSE 'staff' END,
  CASE email
    WHEN 'tech@meiyugroup.org' THEN ARRAY['Boston','New York','Miami','San Francisco','Los Angeles']
    WHEN 'ca@aet21.com' THEN ARRAY['Miami','San Francisco','Los Angeles']
    WHEN 'edzhaotalk@hotmail.com' THEN ARRAY['Boston','New York']
  END, true
FROM public.users
WHERE email IN ('tech@meiyugroup.org','ca@aet21.com','edzhaotalk@hotmail.com')
ON CONFLICT DO NOTHING;
COMMIT;
