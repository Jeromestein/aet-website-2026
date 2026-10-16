-- Allow independently provisioned Supabase staff without creating a Payload user.
-- Existing roster values and public.users credentials are never updated here.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'aet_private.staff_accounts'::regclass
      AND contype = 'p' AND pg_get_constraintdef(oid) = 'PRIMARY KEY (legacy_user_id)'
  ) THEN
    ALTER TABLE aet_private.password_recovery DROP CONSTRAINT password_recovery_legacy_user_id_fkey;
    ALTER TABLE aet_private.staff_accounts DROP CONSTRAINT staff_accounts_pkey;
    ALTER TABLE aet_private.staff_accounts ADD CONSTRAINT staff_accounts_legacy_user_id_key UNIQUE (legacy_user_id);
    ALTER TABLE aet_private.staff_accounts ADD CONSTRAINT staff_accounts_pkey PRIMARY KEY (migration_id);
    ALTER TABLE aet_private.staff_accounts ALTER COLUMN legacy_user_id DROP NOT NULL;
    ALTER TABLE aet_private.password_recovery ADD CONSTRAINT password_recovery_legacy_user_id_fkey
      FOREIGN KEY (legacy_user_id) REFERENCES aet_private.staff_accounts(legacy_user_id);
    ALTER TABLE aet_private.staff_accounts ADD CONSTRAINT staff_accounts_identity_check
      CHECK (legacy_user_id IS NOT NULL OR auth_user_id IS NOT NULL);
  END IF;
END $$;

ALTER TABLE aet_private.password_recovery ADD COLUMN IF NOT EXISTS staff_id uuid
  REFERENCES aet_private.staff_accounts(migration_id);
UPDATE aet_private.password_recovery r SET staff_id=s.migration_id
  FROM aet_private.staff_accounts s WHERE r.staff_id IS NULL AND r.legacy_user_id=s.legacy_user_id;
ALTER TABLE aet_private.password_recovery ALTER COLUMN legacy_user_id DROP NOT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='aet_private.password_recovery'::regclass AND conname='password_recovery_identity_check') THEN
    ALTER TABLE aet_private.password_recovery ADD CONSTRAINT password_recovery_identity_check
      CHECK (staff_id IS NOT NULL OR legacy_user_id IS NOT NULL);
  END IF;
END $$;
ALTER TABLE aet_private.staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE aet_private.password_recovery ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON aet_private.staff_accounts, aet_private.password_recovery FROM PUBLIC, anon, authenticated;
COMMIT;
