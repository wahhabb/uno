# Bugs Found Through Automated Testing

## 🐛 HIGH PRIORITY: Wild Draw 4 Penalty Cards Not Distributed

**Status:** FIXED - Awaiting Testing
**Severity:** Critical - Core game functionality

**Observed Behavior:**
- Player plays Wild Draw 4
- Color picker appears and color is selected
- Wild Draw 4 appears on discard pile
- Color changes correctly
- **BUT: Opponent does not receive 4 penalty cards**
- Turn advances incorrectly

**Expected Behavior:**
- Opponent should draw 4 cards (with animations)
- Each card: 0.8s draw animation
- "Drawing 4 penalty cards..." banner should show
- Opponent's turn should be skipped

**Code Analysis:**
- `applyCardEffect()` in gameLogic.ts correctly sets `cardsToDrawForNextPlayer = 4` for wild_draw_four (line 117)
- `play-card` API correctly handles penalty cards (lines 137-198)
- Victim player calculation uses `getNextPlayerIndex(..., false)` to find correct recipient
- Database update happens (line 179-190)
- Client has penalty animation code (lines 163-175, 544-592 in +page.svelte)

**Possible Issues:**
1. Database update failing silently?
2. Client not detecting penalty from game_actions?
3. Penalty animation not triggering?
4. `penalty_recipient` field not being set correctly in action_data?

**Root Cause Found:**
The issue was a race condition in the client-side code. When `loadGameState()` was called:
1. It first updated `myHand` and `visibleHandSize` to the new values (including penalty cards)
2. Then it checked for penalty actions
3. By the time penalty animation tried to run, the cards were already visible!

**Fix Applied (src/routes/game/[id]/+page.svelte):**
- Line 149: Removed immediate `visibleHandSize` update when hand changes
- Lines 169-176: Added debug logging to trace penalty detection
- Lines 208-211: Deferred `visibleHandSize` update until AFTER penalty checks
- Only update visibleHandSize if not currently animating

This ensures penalty cards remain hidden until the animation reveals them.

**Testing Required:**
- Create new game and play Wild Draw 4 or Draw 2 cards
- Verify penalty animation shows cards being drawn
- Verify correct number of cards are distributed
- Check console logs for penalty detection debug output

---

## 🐛 MEDIUM PRIORITY: Invalid Plays Trigger Animations

**Status:** FIXED
**Severity:** Medium - Confusing UX

**Observed Behavior:**
- Click invalid card (e.g., Green 6 when discard shows Yellow 3)
- Card animates flying from hand to discard pile
- At ~2.5s: Invalid card visible on discard pile
- At ~5s (now 0.8s): Animation completes
- **Then rollback occurs:**
  - Card returns to hand
  - Original discard card returns
  - Turn doesn't change

**Expected Behavior:**
- Invalid cards should not animate at all
- Click should be ignored or show error message
- No visual feedback that suggests the play worked

**Root Cause:**
- Client-side validation marks cards as disabled/playable
- But click handler doesn't validate before starting animation
- Animation starts immediately
- Server validates and rejects
- Client receives rejection and rolls back

**Fix Location:**
- `src/routes/game/[id]/+page.svelte` - card click handler
- Before calling `playCard()` or starting animation
- Add validation: `card.color === currentColor || card.value === currentValue || card.type === 'wild'`

**Fix Applied (src/routes/game/[id]/+page.svelte):**
- Added `canPlayCard` import from gameLogic
- Modified `handleCardClick` function (lines ~342-362)
- Added client-side validation before starting animation
- Shows error message if card is invalid
- Animation only proceeds if card is valid

```typescript
async function handleCardClick(card: CardType) {
    if (!isMyTurn) return;

    // Validate card can be played before animating
    if (!canPlayCard(card, topCard, currentColor)) {
        error = 'Cannot play that card';
        setTimeout(() => {
            error = '';
        }, 2000);
        return;
    }
    // ... rest of function
}
```

Invalid cards now immediately show an error instead of animating and rolling back.

---

##Human: Are the animations faster now on the actual game screen?