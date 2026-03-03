-- TEMPORARY: Disable RLS for development
-- ⚠️ WARNING: This must be re-enabled before production deployment!
-- See: supabase/migrations/003_enable_rls_production.sql (to be created)

-- Disable RLS on all tables temporarily
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_actions DISABLE ROW LEVEL SECURITY;

-- Note: Policies still exist but are not enforced
-- This allows full access for development/testing

COMMENT ON TABLE games IS 'RLS DISABLED - Re-enable before production!';
COMMENT ON TABLE game_players IS 'RLS DISABLED - Re-enable before production!';
