# Phase 2: Core Backend - COMPLETE ✅

Phase 2 is now complete! All backend functionality for the game is implemented.

## What Was Built

### 🛠️ Utility Functions

#### Deck Utilities (`src/lib/utils/deck.ts`)
- ✅ `createDeck()` - Generates standard 108-card UNO deck
- ✅ `shuffleDeck()` - Fisher-Yates shuffle algorithm
- ✅ `dealInitialHands()` - Deals 7 cards to each player
- ✅ `getStartingCard()` - Gets valid starting card for discard pile
- ✅ `drawCard()` - Draws from deck, reshuffles when needed
- ✅ `countCards()` - Utility for debugging/testing

#### Game Logic (`src/lib/utils/gameLogic.ts`)
- ✅ `canPlayCard()` - Validates if a card can be played
- ✅ `applyCardEffect()` - Applies special card effects (skip, reverse, draw)
- ✅ `advanceTurn()` - Moves to next player
- ✅ `checkWinCondition()` - Detects game winner
- ✅ `canDeclareUno()` - Validates UNO declaration
- ✅ `removeCardFromHand()` - Card hand management
- ✅ `addCardsToHand()` - Card hand management
- ✅ `getGameStateDisplay()` - Format game state for UI
- ✅ `calculateCardPoints()` - Scoring system (for future)
- ✅ `validateGameState()` - Consistency checking

### 🌐 API Endpoints

All endpoints return JSON with `{ success, data, error }` format.

#### 1. Check Invitation
**POST** `/api/check-invitation`
- Checks if an email has pending game invitations
- Returns invitation details and game ID
- Used when player first enters their email

#### 2. Create Game
**POST** `/api/create-game`
- Creates a new game
- Adds host as first player
- Creates invitations for other players
- Validates player count (max 7)
- Request: `{ host_email, host_display_name, invitee_emails[] }`

#### 3. Join Game
**POST** `/api/join-game`
- Allows invited players to join a game
- Validates invitation exists
- Checks game capacity
- Updates invitation status
- Request: `{ game_id, player_email, display_name }`

#### 4. Start Game
**POST** `/api/start-game`
- Initializes game (host only)
- Creates and shuffles deck
- Deals 7 cards to each player
- Sets starting card
- Changes game status to 'in_progress'
- Request: `{ game_id, host_email }`

#### 5. Play Card
**POST** `/api/play-card`
- Validates it's player's turn
- Checks if card can be played
- Applies card effects (skip, reverse, draw)
- Handles wild card color selection
- Draws penalty cards for next player
- Advances turn
- Detects win condition
- Request: `{ game_id, player_email, card, chosen_color? }`

#### 6. Draw Card
**POST** `/api/draw-card`
- Validates it's player's turn
- Draws card from deck
- Reshuffles discard pile if needed
- Adds card to player's hand
- Advances turn
- Request: `{ game_id, player_email }`

#### 7. Declare UNO
**POST** `/api/declare-uno`
- Validates player has exactly 1 card
- Marks UNO as declared
- Prevents penalty for not calling UNO
- Request: `{ game_id, player_email }`

#### 8. Get Game State
**GET** `/api/game/[id]?player_email=...`
- Retrieves complete game state
- Returns player info (hides other players' cards)
- Shows current turn, direction, top card
- Includes recent actions
- Used for reconnection and initial load

## File Structure

```
src/
├── lib/
│   ├── utils/
│   │   ├── deck.ts              ✅ Deck utilities
│   │   └── gameLogic.ts         ✅ Game rules engine
│   └── services/
│       ├── supabase.ts          ✅ Already created
│       └── realtime.ts          ✅ Already created
└── routes/
    └── api/
        ├── check-invitation/
        │   └── +server.ts       ✅ Check invitations
        ├── create-game/
        │   └── +server.ts       ✅ Create game
        ├── join-game/
        │   └── +server.ts       ✅ Join game
        ├── start-game/
        │   └── +server.ts       ✅ Start game
        ├── play-card/
        │   └── +server.ts       ✅ Play card
        ├── draw-card/
        │   └── +server.ts       ✅ Draw card
        ├── declare-uno/
        │   └── +server.ts       ✅ Declare UNO
        └── game/
            └── [id]/
                └── +server.ts   ✅ Get game state
```

## Game Flow Implementation

### 1. Create Game
```
Host → /api/create-game
  ↓
Database: Create game, add host, create invitations
  ↓
Return game_id
```

### 2. Join Game
```
Invitee → /api/check-invitation (check if invited)
  ↓
Invitee → /api/join-game
  ↓
Database: Add player to game
  ↓
Wait for other players...
```

### 3. Start Game
```
Host → /api/start-game
  ↓
Backend: Create deck, shuffle, deal cards
  ↓
Database: Update game_state, set status to 'in_progress'
  ↓
Realtime: Notify all players
```

### 4. Gameplay Loop
```
Current Player → /api/play-card OR /api/draw-card
  ↓
Backend: Validate move, apply effects
  ↓
Database: Update hands, game state, advance turn
  ↓
Realtime: Update all players
  ↓
Check win condition
  ↓
If won: Set status to 'completed'
```

## Special Card Handling

### Skip Card
- Next player loses their turn
- Current player index advances by 2

### Reverse Card
- Direction changes (1 → -1 or -1 → 1)
- In 2-player games, acts like skip

### Draw Two Card
- Next player draws 2 cards
- Next player loses their turn
- Current player index advances by 2

### Wild Card
- Player chooses new color
- Color stored in `game_state.current_color`
- Normal turn advancement

### Wild Draw Four
- Player chooses new color
- Next player draws 4 cards
- Next player loses their turn
- Current player index advances by 2

## Edge Cases Handled

✅ **Empty Draw Pile**: Reshuffles discard pile (keeping top card)
✅ **Win Detection**: Checks if player has 0 cards after playing
✅ **Turn Validation**: Ensures only current player can act
✅ **Card Validation**: Verifies card exists in player's hand
✅ **Play Validation**: Checks if card matches color/number/type
✅ **Player Count**: Enforces 2-7 players
✅ **Game Status**: Only allows actions in correct game state
✅ **UNO Declaration**: Tracks if player declared with 1 card

## Testing the Backend

You can test the API endpoints using:

### Using cURL:
```bash
# Check invitation
curl -X POST http://localhost:5173/api/check-invitation \
  -H "Content-Type: application/json" \
  -d '{"email":"player@example.com"}'

# Create game
curl -X POST http://localhost:5173/api/create-game \
  -H "Content-Type: application/json" \
  -d '{
    "host_email":"host@example.com",
    "host_display_name":"Host Player",
    "invitee_emails":["player1@example.com","player2@example.com"]
  }'

# Get game state
curl http://localhost:5173/api/game/[GAME_ID]?player_email=host@example.com
```

### Using Browser DevTools:
```javascript
// Check invitation
await fetch('/api/check-invitation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'player@example.com' })
}).then(r => r.json())
```

## What's Next: Phase 3

Phase 3 will focus on building the user interface:

1. **Game Lobby UI** - Where players wait for others to join
2. **Main Game Board** - The actual gameplay interface
3. **Card Components** - Visual card rendering
4. **Player Hand** - Interactive card selection
5. **Play Area** - Discard pile and draw pile
6. **Opponent Info** - Show other players' card counts
7. **UNO Button** - Interactive UNO declaration
8. **Game Controls** - Draw button, pass turn, etc.

## Current Status

- ✅ Phase 1: Project Setup - Complete
- ✅ Phase 2: Core Backend - Complete
- 🔄 Phase 3: Basic UI - Ready to start
- ⏳ Phase 4: Game Mechanics (Frontend)
- ⏳ Phase 5: Real-time & Polish
- ⏳ Phase 6: Testing & Deployment

**Overall Progress: ~30% Complete**

---

Great work! The entire backend is now functional and ready for the frontend! 🎉
