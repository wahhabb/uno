# Getting Started with UNO Online

Welcome! Phase 1 setup is complete. Here's how to get your UNO game up and running.

## ✅ What's Already Done

Your project is fully scaffolded with:
- SvelteKit + TypeScript configured
- Complete database schema ready
- Project structure established
- Landing page created
- All configuration files in place

## 🚀 Next: Set Up Supabase (Required)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Name it "uno-online" (or your choice)
4. Create a database password (save it!)
5. Choose a region
6. Wait for project to initialize (~2 minutes)

### Step 2: Run Database Migration

**In Supabase Dashboard:**

1. Click "SQL Editor" in the sidebar
2. Click "New query"
3. Open `supabase/migrations/001_initial_schema.sql` from your project
4. Copy the entire file contents
5. Paste into the SQL editor
6. Click "Run" (bottom right)
7. You should see "Success" with 6 tables created

**Verify:**
- Go to "Table Editor" - you should see: players, games, game_players, game_invitations, game_state, game_actions

### Step 3: Get API Credentials

1. In Supabase dashboard, go to Settings → API
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (long string)
   - **service_role** key (different long string)

### Step 4: Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and paste your values:
   ```env
   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

### Step 5: Run the App!

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser!

You should see the UNO landing page with email entry.

## 📋 Optional: Gather Assets

While developing, you'll want to add game assets:

### Card Images
1. Visit [creazilla.com/media/clipart/uno](https://creazilla.com/media/clipart/uno)
2. Download UNO card SVGs
3. Place in `static/assets/cards/` following the naming in `static/assets/cards/README.md`

### Sound Effects
1. Visit [freesound.org](https://freesound.org)
2. Search for card sounds, UI clicks, etc.
3. Download as MP3
4. Place in `static/assets/sounds/` following `static/assets/sounds/README.md`

**Note:** Assets can be added anytime. The app will work without them initially.

## 🛠️ Troubleshooting

### "Module not found" errors
- Make sure you ran `npm install`
- Check that all dependencies installed successfully

### Supabase connection errors
- Verify `.env` file exists and has correct credentials
- Check that your Supabase project is active
- Ensure PUBLIC_SUPABASE_URL starts with `https://`

### TypeScript errors
- Run `npm run check` to see type errors
- Make sure all dependencies are installed
- Restart your IDE/editor

### Page not loading
- Check the terminal for error messages
- Make sure port 5173 isn't already in use
- Try `npm run dev -- --port 5174` to use a different port

## 📖 Documentation Quick Links

- **[README.md](README.md)** - Project overview
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** - Full development roadmap
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Current progress and next steps
- **[supabase/README.md](supabase/README.md)** - Detailed Supabase setup
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - How to deploy to Vercel

## ✨ What's Next?

After completing this setup, you're ready for **Phase 2: Core Backend** which includes:

1. Implementing API endpoints for game actions
2. Building deck and game logic utilities
3. Setting up real-time synchronization
4. Creating the game lobby and main game screens

See `PROJECT_STATUS.md` for detailed Phase 2 tasks.

## 🎯 Quick Command Reference

```bash
# Development
npm run dev          # Start dev server
npm run check        # Type checking
npm run build        # Build for production
npm run preview      # Preview production build

# Useful during development
npm run check:watch  # Watch mode for type checking
```

## 💡 Tips

1. **Start Small**: Get Supabase working first, then build features incrementally
2. **Test Often**: Check the browser console for errors as you develop
3. **Read the Docs**: Each README file has detailed information for its area
4. **Follow the Plan**: `IMPLEMENTATION_PLAN.md` has the complete roadmap

## 🎮 Ready to Play?

Once you complete the Supabase setup above:
1. Run `npm run dev`
2. Open the app
3. You'll see the email entry page
4. Backend functionality comes in Phase 2!

---

**Need Help?** Check the documentation files or review the implementation plan for guidance.

Good luck building your UNO game! 🎉
