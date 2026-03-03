# ⚠️ CRITICAL: RLS Must Be Re-enabled Before Production

## Current Status: RLS DISABLED

Row Level Security is currently **DISABLED** on all tables to allow development and testing.

## Why It's Disabled

The current RLS policies were designed for JWT-based authentication, but we're using email-based identification without JWTs. This caused infinite recursion errors in the policies.

## What Needs to Be Done Before Production

### Option A: Implement JWT Authentication (Recommended)

1. Use Supabase Auth for email/magic link authentication
2. Users get proper JWT tokens
3. Re-enable the original RLS policies from migration 001
4. Test thoroughly

### Option B: Rewrite RLS Policies for Email-Based Auth

1. Simplify policies to not use JWT claims
2. Use service role key for server-side operations
3. Implement custom security checks in API endpoints
4. Create new RLS policies that work without circular dependencies

### Migration to Re-enable RLS

Create `supabase/migrations/003_enable_rls_production.sql`:

```sql
-- Re-enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_actions ENABLE ROW LEVEL SECURITY;

-- Then either:
-- A) Restore original policies (if using JWT auth)
-- B) Create new simplified policies (if staying with email auth)
```

## Security Implications

Without RLS:
- ⚠️ Any authenticated user can access any game data
- ⚠️ Users could theoretically access other players' hands
- ⚠️ No database-level authorization enforcement
- ✅ API endpoints still validate (but this is not enough for production)

## Checklist Before Going Live

- [ ] Decide on authentication approach (JWT vs email-based)
- [ ] Implement proper authentication if needed
- [ ] Create migration 003 to re-enable RLS
- [ ] Write new RLS policies (if needed)
- [ ] Test RLS policies thoroughly
- [ ] Run migration 003 in production
- [ ] Verify all game functionality still works
- [ ] Security audit

## Timeline

**Target**: Before production deployment
**Priority**: HIGH - Security critical

---

**Remember**: The app will work fine without RLS during development, but it's a security risk in production!
