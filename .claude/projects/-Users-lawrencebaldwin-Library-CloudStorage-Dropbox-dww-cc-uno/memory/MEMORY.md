# UNO Online Game - Memory

## Critical Security Note

⚠️ **ROW LEVEL SECURITY (RLS) IS CURRENTLY DISABLED**

- RLS was disabled in development to avoid infinite recursion errors
- The policies were designed for JWT auth, but we're using email-based identification
- **MUST re-enable RLS before production deployment**
- See: `supabase/TODO_RLS_PRODUCTION.md` for details
- Migration 002 disabled RLS temporarily
- Need to create migration 003 to re-enable before going live

## Project Context

- Building multiplayer online UNO game
- Tech: SvelteKit, TypeScript, Supabase, Native CSS
- Max 7 players per game
- Email-based invitations (no password auth)
- Standard UNO rules

## Key Decisions

1. **Authentication**: Email-based identification without passwords (for MVP)
   - Users identified by email only
   - No Supabase Auth initially (deferred)
   - May need to implement JWT auth for production RLS

2. **Database**: Supabase with 6 tables
   - players, games, game_players, game_invitations, game_state, game_actions

3. **RLS Status**: DISABLED for development (see security note above)

## Phase Status

- Phase 1: Complete ✅ (Setup)
- Phase 2: Complete ✅ (Backend APIs)
- Phase 3: Next up (UI)

## Common Issues

1. **Supabase Keys**: Use "Legacy keys" not the new publishable keys
   - Legacy keys are JWT format starting with "eyJ..."
   - New keys format (ysb_publishable_) don't work with current SDK

2. **RLS Infinite Recursion**: Fixed by disabling RLS temporarily
   - Caused by circular policy dependencies
   - Need proper auth strategy for production

## Important Files

- `IMPLEMENTATION_PLAN.md` - Full roadmap
- `PROJECT_STATUS.md` - Current progress
- `supabase/TODO_RLS_PRODUCTION.md` - RLS re-enablement plan
- `PHASE2_COMPLETE.md` - Backend API documentation
