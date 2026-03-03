# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter a project name (e.g., "uno-online")
5. Create a strong database password (save this!)
6. Select a region close to your users
7. Click "Create new project"

## 2. Get Your API Credentials

1. Once your project is created, go to Settings → API
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (this is safe to use in the browser)
   - **service_role** key (keep this secret! server-side only)

## 3. Set Up Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:
   ```bash
   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

## 4. Run the Database Migration

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy the contents of `migrations/001_initial_schema.sql`
5. Paste it into the SQL editor
6. Click "Run" to execute the migration

### Option B: Using Supabase CLI

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Push the migration:
   ```bash
   supabase db push
   ```

## 5. Enable Realtime

The migration automatically adds tables to the realtime publication, but you should verify:

1. Go to Database → Replication in your Supabase dashboard
2. Ensure these tables are enabled for realtime:
   - `games`
   - `game_players`
   - `game_state`
   - `game_actions`

## 6. Set Up Scheduled Function (Optional)

To automatically clean up abandoned games:

1. Go to Database → Functions in Supabase dashboard
2. Create a new Edge Function or use pg_cron
3. Schedule `SELECT cleanup_abandoned_games();` to run every hour

Example using pg_cron:
```sql
SELECT cron.schedule(
  'cleanup-abandoned-games',
  '0 * * * *', -- Every hour
  $$ SELECT cleanup_abandoned_games(); $$
);
```

## 7. Verify Setup

1. Go to Table Editor in Supabase dashboard
2. You should see all 6 tables:
   - players
   - games
   - game_players
   - game_invitations
   - game_state
   - game_actions

3. Check that Row Level Security is enabled on all tables

## Troubleshooting

### Issue: RLS policies blocking requests

The current RLS policies rely on JWT claims. For email-based identification without full auth:

1. We'll need to modify the RLS policies to be more permissive initially
2. Or implement a simple auth system with magic links
3. For MVP, consider disabling RLS temporarily during development (not recommended for production!)

### Issue: Realtime not working

1. Check that tables are added to the realtime publication
2. Verify your anon key has the correct permissions
3. Check the browser console for connection errors

## Next Steps

After completing this setup:
1. Test the connection by running `npm run dev`
2. Open the browser console and check for any Supabase connection errors
3. Try creating a player record manually in the Table Editor to verify connectivity
