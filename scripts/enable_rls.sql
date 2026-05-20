-- Enable Row Level Security on every public-schema table.
--
-- Background: Supabase exposes a PostgREST endpoint
-- (https://<project>.supabase.co/rest/v1/*) that authenticates with the
-- `anon` key. Without RLS, anyone with the anon key can read/write every
-- public table. Enabling RLS closes that hole.
--
-- App impact: Prisma connects as the `postgres` role on Supabase, which has
-- BYPASSRLS — these policies do not affect Prisma queries. The Supabase
-- `service_role` also has BYPASSRLS. The `anon` and `authenticated` roles
-- do NOT, and with no allow-policy on these tables, they are denied all
-- access (PostgreSQL RLS is default-deny).
--
-- We add an explicit FOR ALL policy granting service_role and authenticated
-- full access. The service_role grant is technically redundant (BYPASSRLS
-- already covers it) but declares intent clearly. The authenticated grant
-- is a no-op today (this app uses NextAuth, not Supabase Auth) but matches
-- the requested posture if Supabase Auth is ever wired in.
--
-- Idempotent: safe to run repeatedly.

BEGIN;

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);

    EXECUTE format(
      'DROP POLICY IF EXISTS "allow_service_and_authenticated" ON public.%I',
      t.tablename
    );
    EXECUTE format(
      'CREATE POLICY "allow_service_and_authenticated" ON public.%I '
      || 'FOR ALL TO service_role, authenticated USING (true) WITH CHECK (true)',
      t.tablename
    );
  END LOOP;
END $$;

COMMIT;
