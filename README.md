# 🎮 UNO Online

A real-time multiplayer UNO card game built with SvelteKit, TypeScript, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works!)
- A Vercel account (for deployment)

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Follow instructions in `supabase/README.md`
   - Run the database migration
   - Get your API credentials

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase credentials

4. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
uno/
├── src/
│   ├── routes/              # SvelteKit pages and API routes
│   │   └── +page.svelte     # Landing page (email entry)
│   ├── lib/
│   │   ├── components/      # Reusable Svelte components
│   │   ├── stores/          # Svelte stores for state management
│   │   ├── utils/           # Utility functions (deck, game logic)
│   │   ├── services/        # Supabase and API services
│   │   └── types/           # TypeScript type definitions
│   └── app.css              # Global styles
├── static/
│   └── assets/
│       ├── cards/           # UNO card SVG images
│       └── sounds/          # Game sound effects
├── supabase/
│   └── migrations/          # Database schema migrations
└── [config files]
```

## 📋 Current Status: Phase 1 Complete ✅

**What's Done:**
- ✅ SvelteKit project initialized with TypeScript
- ✅ Supabase configuration set up
- ✅ Complete database schema created
- ✅ TypeScript types defined
- ✅ Project structure established
- ✅ Vercel deployment configured
- ✅ Asset organization documented
- ✅ Basic landing page created

**Next Steps (Phase 2):**
- Implement API endpoints (create game, join game, etc.)
- Implement deck creation and shuffling
- Implement core game logic (card validation, turn management)
- Set up Realtime subscriptions

See `IMPLEMENTATION_PLAN.md` for the full development roadmap.

## 🎮 How to Play

1. **Join**: Enter your email to join or create a game
2. **Invite**: Host invites friends via email
3. **Play**: Match cards by color or number, use action cards strategically
4. **Win**: Be the first to play all your cards (and remember to press UNO!)

## 🛠 Tech Stack

- **Frontend**: SvelteKit 2.0 with TypeScript
- **Styling**: Native CSS (no frameworks)
- **Database**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime
- **Deployment**: Vercel
- **Assets**: SVG cards, MP3 sound effects

## 📚 Documentation

- **[Implementation Plan](IMPLEMENTATION_PLAN.md)** - Complete development roadmap
- **[Supabase Setup](supabase/README.md)** - Database configuration guide
- **[Deployment Guide](DEPLOYMENT.md)** - How to deploy to Vercel
- **[Card Assets](static/assets/cards/README.md)** - Card image documentation
- **[Sound Effects](static/assets/sounds/README.md)** - Audio asset guide

## 🎯 Features

### MVP Features
- ✅ Email-based player identification
- 🔄 Game creation and invitations
- 🔄 Private game rooms (max 7 players)
- 🔄 Standard UNO rules
- 🔄 UNO button declaration
- 🔄 Real-time game updates
- 🔄 Card animations
- 🔄 Sound effects
- 🔄 Mobile-responsive design
- 🔄 Reconnection support
- 🔄 1-hour game timeout

### Future Features
- Saved player groups
- In-game chat
- Game statistics
- Public game rooms
- Turn timers

## 🧪 Development Commands

```bash
# Development server
npm run dev

# Type checking
npm run check

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 License

This project is for educational purposes. Ensure all card images and sound effects comply with their respective licenses before commercial use.

## 👥 Contributing

This is a personal project following the plan in `IMPLEMENTATION_PLAN.md`. Feel free to fork and modify for your own use!

## 📞 Support

For issues or questions, refer to the documentation in each subdirectory or check the implementation plan for guidance.

---

Built with ❤️ using Claude Code
