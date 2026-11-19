-- Run once for the dedicated Production staff connection with migration disabled.
GRANT USAGE ON SCHEMA aet_private TO aet_staff_membership_runtime;
GRANT SELECT (auth_user_id, email, role, offices, include_unassigned, active, migration_state)
    ON aet_private.staff_accounts TO aet_staff_membership_runtime;
CREATE POLICY application_staff_membership ON aet_private.staff_accounts
    FOR SELECT TO aet_staff_membership_runtime USING (active);
GRANT SELECT, INSERT, UPDATE, DELETE ON aet_private.auth_attempts TO aet_staff_membership_runtime;
CREATE POLICY application_staff_attempts ON aet_private.auth_attempts
    FOR ALL TO aet_staff_membership_runtime USING (true) WITH CHECK (true);
