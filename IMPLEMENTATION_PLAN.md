# Online Uno Game - Implementation Plan

## Project Overview
A multiplayer online Uno card game built with SvelteKit, TypeScript, Supabase, and native CSS. Players can invite friends via email to play together in real-time from different locations.

---

## Tech Stack
- **Frontend Framework**: SvelteKit (with TypeScript)
- **Styling**: Native CSS (no frameworks)
- **Database & Backend**: Supabase (PostgreSQL + Realtime)
- **Card Assets**: SVG files from Creazilla
- **Sound Effects**: Royalty-free sounds (to be sourced)
- **Deployment**: Vercel

---

## Core Features

### Phase 1: MVP (Minimum Viable Product)
1. Email-based player identification (no password auth)
2. Game creation and email invitations
3. Game lobby (private rooms only, max 7 players)
4. Core Uno gameplay with standard rules
5. "UNO" button declaration
6. Real-time game updates
7. Card animations and sound effects
8. Mobile-responsive design
9. Game persistence with 1-hour timeout
10. Reconnection support

### Deferred Features (Future Phases)
- Saved player groups
- In-game chat/reactions
- Player statistics and game history
- Public game rooms
- Turn timers

---

## Database Schema

### Tables

#### `players`
```sql
- email (TEXT, PRIMARY KEY)
- display_name (TEXT, NOT NULL)
- created_at (TIMESTAMP, DEFAULT NOW())
- last_seen (TIMESTAMP)
```

#### `games`
```sql
- id (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- host_email (TEXT, FOREIGN KEY → players.email)
- status (TEXT, CHECK IN ['waiting', 'in_progress', 'completed', 'abandoned'])
- direction (INTEGER, DEFAULT 1) -- 1 for clockwise, -1 for counter-clockwise
- current_player_index (INTEGER, DEFAULT 0)
- created_at (TIMESTAMP, DEFAULT NOW())
- last_activity (TIMESTAMP, DEFAULT NOW())
- winner_email (TEXT, NULLABLE)
```

#### `game_players`
```sql
- id (UUID, PRIMARY KEY)
- game_id (UUID, FOREIGN KEY → games.id)
- player_email (TEXT, FOREIGN KEY → players.email)
- player_order (INTEGER, NOT NULL) -- Position in turn order (0-6)
- hand (JSONB, DEFAULT '[]') -- Array of card objects
- uno_declared (BOOLEAN, DEFAULT FALSE)
- joined_at (TIMESTAMP, DEFAULT NOW())
- UNIQUE(game_id, player_email)
- UNIQUE(game_id, player_order)
```

#### `game_invitations`
```sql
- id (UUID, PRIMARY KEY)
- game_id (UUID, FOREIGN KEY → games.id)
- invitee_email (TEXT, NOT NULL)
- status (TEXT, CHECK IN ['pending', 'accepted', 'declined'])
- created_at (TIMESTAMP, DEFAULT NOW())
```

#### `game_state`
```sql
- game_id (UUID, PRIMARY KEY, FOREIGN KEY → games.id)
- draw_pile (JSONB) -- Array of card objects (shuffled deck)
- discard_pile (JSONB) -- Array of card objects (top card visible)
- current_color (TEXT) -- For wild cards (red, blue, green, yellow)
- updated_at (TIMESTAMP, DEFAULT NOW())
```

#### `game_actions` (for history/debugging)
```sql
- id (UUID, PRIMARY KEY)
- game_id (UUID, FOREIGN KEY → games.id)
- player_email (TEXT)
- action_type (TEXT) -- 'play_card', 'draw_card', 'declare_uno', 'call_uno_fail'
- action_data (JSONB) -- Card played, etc.
- created_at (TIMESTAMP, DEFAULT NOW())
```

### Indexes
- `game_invitations.invitee_email` (for quick lookup when player enters email)
- `games.last_activity` (for finding stale games to clean up)
- `game_actions.game_id, created_at` (for game history)

---

## Card Data Structure

### Card Object (JSON)
```typescript
interface Card {
  id: string;          // Unique identifier
  type: 'number' | 'skip' | 'reverse' | 'draw_two' | 'wild' | 'wild_draw_four';
  color: 'red' | 'blue' | 'green' | 'yellow' | null; // null for wild cards
  value?: number;      // 0-9 for number cards
}
```

### Standard Uno Deck (108 cards)
- Number cards (0-9): 2 of each color (except 0: 1 of each) = 76 cards
- Skip: 2 of each color = 8 cards
- Reverse: 2 of each color = 8 cards
- Draw Two: 2 of each color = 8 cards
- Wild: 4 cards
- Wild Draw Four: 4 cards

---

## Application Architecture

### Frontend Structure (SvelteKit)
```
src/
├── routes/
│   ├── +page.svelte              # Landing/email entry page
│   ├── lobby/
│   │   └── +page.svelte          # Game lobby (invite players or join)
│   ├── game/
│   │   └── [gameId]/
│   │       └── +page.svelte      # Main game interface
│   └── api/
│       ├── create-game/
│       │   └── +server.ts        # Create game endpoint
│       ├── join-game/
│       │   └── +server.ts        # Join game endpoint
│       └── game-action/
│           └── +server.ts        # Play card, draw, etc.
├── lib/
│   ├── components/
│   │   ├── Card.svelte           # Single card component
│   │   ├── PlayerHand.svelte     # Player's hand of cards
│   │   ├── PlayArea.svelte       # Center discard pile
│   │   ├── OpponentInfo.svelte   # Other players' info
│   │   ├── UnoButton.svelte      # UNO declaration button
│   │   └── GameControls.svelte   # Draw pile, pass turn
│   ├── stores/
│   │   ├── game.ts               # Game state store
│   │   ├── player.ts             # Current player store
│   │   └── audio.ts              # Sound effects manager
│   ├── utils/
│   │   ├── deck.ts               # Deck creation & shuffling
│   │   ├── gameLogic.ts          # Uno rules validation
│   │   ├── cardValidation.ts     # Can card be played?
│   │   └── animations.ts         # Card animation helpers
│   ├── services/
│   │   ├── supabase.ts           # Supabase client
│   │   └── realtime.ts           # Realtime subscriptions
│   └── types/
│       └── index.ts              # TypeScript interfaces
└── assets/
    ├── cards/                    # SVG card files
    └── sounds/                   # Audio files
```

---

## Game Flow

### 1. Player Entry
```
1. User lands on homepage
2. Enters email address
3. Optionally enters display name (or uses default from email)
4. System checks for pending invitations
   - If invited → redirect to game lobby
   - If not invited → show "Create Game" screen
```

### 2. Game Creation
```
1. Player (host) enters emails of players to invite
2. System creates:
   - Game record (status: 'waiting')
   - Game invitation records
   - Adds host to game_players
3. Host is taken to lobby
4. Email notifications sent to invitees (optional feature)
```

### 3. Joining Game
```
1. Invited player enters their email
2. System finds pending invitation
3. Player enters display name
4. Player added to game_players with next available player_order
5. Redirect to lobby
```

### 4. Game Start
```
1. When all players have joined (or host manually starts)
2. System:
   - Creates shuffled deck in game_state.draw_pile
   - Deals 7 cards to each player (updates game_players.hand)
   - Places one card in discard_pile
   - Sets game status to 'in_progress'
   - Sets current_player_index to 0
3. All players' screens update via Realtime
```

### 5. Gameplay Loop
```
1. Current player's turn:
   - Can play a valid card from hand
   - Or draw a card from draw pile
   - Can declare "UNO" when down to one card
2. Other players:
   - Can call out if current player didn't declare UNO
   - Wait for their turn
3. Each action updates game_state and broadcasts via Realtime
4. Turn advances to next player
```

### 6. Special Cards
- **Skip**: Next player loses their turn
- **Reverse**: Turn order reverses
- **Draw Two**: Next player draws 2 cards and loses turn
- **Wild**: Player chooses new color
- **Wild Draw Four**: Player chooses color, next player draws 4 and loses turn

### 7. Winning
```
1. Player plays their last card
2. If UNO was declared properly → Player wins
3. Game status set to 'completed'
4. [Player name] Won!!! shown with confetti for 4 secods
5. Winner recorded in games.winner_email
6. Game over screen shown to all players
7. Game over screen has option to start new game with same players
```

### 8. Reconnection
```
1. Player re-enters email
2. System finds their active game
3. Restores full game state from database
4. Subscribes to Realtime updates
5. Player continues from where they left off
```

### 9. Game Timeout
```
1. Background job (or Supabase function) checks games.last_activity
2. Games with no activity for 1 hour set to 'abandoned'
3. Players trying to rejoin within next hour see "Game expired" message
4. Games with last_activity == 'abandoned' for >= 1 hour are deleted
```

---

## Real-time Synchronization

### Supabase Realtime Channels
Each game subscribes to:
```typescript
// Subscribe to game state changes
supabase
  .channel(`game:${gameId}`)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
    handleGameUpdate
  )
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'game_players', filter: `game_id=eq.${gameId}` },
    handlePlayersUpdate
  )
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'game_state', filter: `game_id=eq.${gameId}` },
    handleStateUpdate
  )
  .subscribe()
```

### Optimistic Updates
- Play card immediately on client (with validation)
- Revert if server rejects (invalid move)
- Show loading state during server processing

---

## Game Logic Implementation

### Core Game Rules (gameLogic.ts)

```typescript
// Key functions to implement:

canPlayCard(card: Card, topCard: Card, currentColor: string): boolean
// - Match color, number, or type
// - Wild cards can always be played
// - Wild Draw Four only if no other valid cards (honor system for MVP)

applyCardEffect(card: Card, gameState: GameState): GameState
// - Skip: increment player index by 2 (accounting for direction)
// - Reverse: multiply direction by -1
// - Draw Two: next player draws 2, skip turn
// - Wild: prompt for color selection
// - Wild Draw Four: prompt for color, next player draws 4, skip turn

advanceTurn(gameState: GameState): GameState
// - Increment current_player_index by direction (1 or -1)
// - Wrap around using modulo player count

checkWinCondition(player: GamePlayer): boolean
// - Player has 0 cards in hand
// - Player declared UNO when they had 1 card

handleUnoCalls(gameState: GameState): void
// - If player has 1 card and didn't press UNO button
// - Other players can call them out
// - Player draws 2 penalty cards
```

---

## UI/UX Design

### Mobile-First Responsive Layout

#### Game Screen Layout
```
┌─────────────────────────────┐
│     Opponent 1 (3 cards)    │ ← Top bar showing other players
├─────────────────────────────┤
│                             │
│    ┌─────┐   ┌─────┐       │
│    │DRAW │   │ TOP │       │ ← Play area (center)
│    │PILE │   │CARD │       │
│    └─────┘   └─────┘       │
│                             │
│  Direction: →  Color: 🔴   │ ← Game info
├─────────────────────────────┤
│  [UNO Button]               │ ← UNO declaration
├─────────────────────────────┤
│  ┌───┐┌───┐┌───┐┌───┐      │
│  │ 🂠││ 🂡││ 🂢││ 🂣│     │ ← Player's hand (scrollable)
│  └───┘└───┘└───┘└───┘      │
└─────────────────────────────┘
```

### Animations
1. **Card Deal**: Cards fly from deck to player hands (staggered)
2. **Card Play**: Card moves from hand to discard pile
3. **Card Draw**: Card moves from draw pile to hand
4. **Reverse**: Arrow animation showing direction change
5. **Skip**: Visual indicator on skipped player
6. **Win**: Confetti or celebration animation

### Sound Effects (to source)
- Card shuffle (game start)
- Card flip (deal, play, draw)
- Special card sounds (skip, reverse, draw)
- UNO button press
- Win sound
- Invalid move (error beep)

---

## Assets Management

### Card SVGs
1. Download from https://creazilla.com/media/clipart/uno
2. Organize by color and type:
   ```
   assets/cards/
   ├── red/
   │   ├── 0.svg through 9.svg
   │   ├── skip.svg
   │   ├── reverse.svg
   │   └── draw-two.svg
   ├── blue/ (same structure)
   ├── green/ (same structure)
   ├── yellow/ (same structure)
   └── wild/
       ├── wild.svg
       └── wild-draw-four.svg
   ```
3. Also need card back design for draw pile

### Sound Effects
Source from:
- **Freesound.org** (CC0 or CC-BY license)
- **OpenGameArt.org**
- **Zapsplat.com** (free tier)

Needed sounds:
- `card-flip.mp3` (play/draw/deal)
- `card-shuffle.mp3` (game start)
- `button-click.mp3` (UNO button)
- `special-card.mp3` (skip/reverse/draw)
- `win.mp3` (game won)
- `error.mp3` (invalid move)

---

## Development Phases

### Phase 1: Project Setup (Week 1)
- [ ] Initialize SvelteKit project with TypeScript
- [ ] Set up Supabase project and obtain credentials
- [ ] Configure Vercel deployment
- [ ] Create database schema and tables
- [ ] Set up folder structure
- [ ] Download and organize card SVG assets
- [ ] Source and add sound effects

### Phase 2: Core Backend (Week 1-2)
- [ ] Implement Supabase client configuration
- [ ] Create API endpoints:
  - [ ] Create game
  - [ ] Join game
  - [ ] Start game
  - [ ] Play card
  - [ ] Draw card
  - [ ] Declare UNO
- [ ] Implement deck creation and shuffling
- [ ] Implement game logic (card validation, turn management)
- [ ] Set up Realtime subscriptions

### Phase 3: Basic UI (Week 2-3)
- [ ] Email entry page
- [ ] Lobby screen (invite players)
- [ ] Basic game board layout
- [ ] Card component with SVG rendering
- [ ] Player hand component
- [ ] Play area (discard pile, draw pile)
- [ ] Opponent info display
- [ ] Mobile-responsive CSS

### Phase 4: Game Mechanics (Week 3-4)
- [ ] Implement card playing logic
- [ ] Implement card drawing
- [ ] Turn management and indicators
- [ ] Special card effects (skip, reverse, draw)
- [ ] Wild card color selection
- [ ] UNO button functionality
- [ ] Win condition detection

### Phase 5: Real-time & Polish (Week 4-5)
- [ ] Real-time game state synchronization
- [ ] Reconnection handling
- [ ] Game timeout mechanism
- [ ] Card animations
- [ ] Sound effect integration
- [ ] Loading states and error handling
- [ ] Game over screen

### Phase 6: Testing & Deployment (Week 5-6)
- [ ] Multi-player testing
- [ ] Mobile device testing
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Deploy to Vercel
- [ ] Monitor and fix bugs

---

## Technical Considerations

### State Management
- Use SvelteKit stores for local state
- Use Supabase as source of truth for game state
- Optimistic UI updates with server validation

### Security
- Row Level Security (RLS) in Supabase:
  - Players can only see games they're part of
  - Players can only modify their own hands
  - Game state can only be modified by current player
- Server-side validation of all moves
- Rate limiting on API endpoints

### Performance
- Lazy load card SVGs
- Compress sound files
- Use Supabase connection pooling
- Minimize Realtime payloads (send deltas, not full state)
- Debounce rapid game actions

### Error Handling
- Network disconnection: Show reconnecting indicator
- Invalid move: Visual feedback, don't execute
- Game not found: Redirect to home
- Invitation expired: Clear message
- Session timeout: Auto-redirect with message

### Accessibility
- Keyboard navigation support
- Screen reader labels for cards
- High contrast mode option
- Larger touch targets for mobile
- Clear visual indicators for current turn

---

## Environment Variables

```env
# .env.local
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (server-side only)
```

---

## Testing Strategy

### Unit Tests
- Card validation logic
- Deck shuffling
- Turn advancement
- Special card effects

### Integration Tests
- Game creation flow
- Player joining flow
- Complete game playthrough
- Reconnection scenarios

### Manual Testing
- Multi-device testing (phone, tablet, desktop)
- Multi-player real game sessions
- Edge cases (disconnection, timeout)
- Browser compatibility (Chrome, Safari, Firefox)

---

## Future Enhancements (Post-MVP)

1. **Saved Groups**: Save frequently played groups with a name
2. **Game Statistics**: Win/loss records, total games played
3. **In-game Chat**: Text chat and emoji reactions
4. **Turn Timers**: Optional time limits per turn
5. **Public Rooms**: Random matchmaking
6. **Custom Rules**: Allow hosts to toggle house rules
7. **Spectator Mode**: Watch games in progress
8. **Tournament Mode**: Multi-game matches with scoring
9. **Themes**: Dark mode, custom card backs
10. **Push Notifications**: Alert players when it's their turn

---

## Success Metrics

- Game creation success rate
- Average game completion time
- Player reconnection rate
- Mobile vs desktop usage
- Active concurrent games
- Bug reports and resolution time

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Real-time sync issues | Thorough testing, fallback to polling if needed |
| Supabase free tier limits | Monitor usage, plan for upgrade path |
| Card asset licensing | Verify Creazilla licensing, have backup sources |
| Mobile performance | Optimize animations, lazy load assets |
| Player abandonment | 1-hour timeout, allow new players to join mid-game (future) |
| Security vulnerabilities | RLS policies, server-side validation, regular audits |

---

## Conclusion

This plan provides a comprehensive roadmap for building a fully-functional online multiplayer Uno game. The phased approach allows for iterative development and testing, with clear MVP goals and a pathway for future enhancements.

**Estimated Timeline**: 5-6 weeks for MVP
**Next Step**: Set up project and Supabase, begin Phase 1
