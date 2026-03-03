# Gray Flash and Card Flip Fixes

## ✅ Issue 1: Gray Flash Every 2 Seconds

### Root Cause
The `.player-area` (where cards are displayed) had no minimum height. During polling every 1-2 seconds:
- `myHand` updates
- `visibleHandSize` updates  
- Number of visible cards changes briefly
- Player area height changes → **gray flash appears**

### Solution
Added fixed minimum height to player area:

```css
.player-area {
  width: 100%;
  min-height: 120px; /* Prevent layout shift when hand size changes */
}
```

**Result:** Player area maintains consistent height even when card count changes momentarily during polling. No more gray flash!

---

## ✅ Issue 2: Card Flip Speed

### Problem
Cards took 800ms to flip face-up after landing, feeling slow.

### Solution
Reduced flip delay from 800ms → 400ms:

```javascript
setTimeout(() => {
  visibleHandSize++;
  flyingCards = flyingCards.filter(c => c.id !== cardId);
  setTimeout(animateNextCard, 100);
}, 400); // Was 800ms, now 400ms
```

**Result:** 
- Card flies to position: 400ms
- Card flips face-up: instant
- Next card starts: +100ms
- **Total per card: ~500ms** (vs 900ms before)
- **7 cards now deal in ~3.5 seconds** (vs 6.3 seconds before)
