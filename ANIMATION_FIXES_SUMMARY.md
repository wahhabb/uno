# Animation and Layout Fixes

## ✅ Issue 1: Gray Stripe Flashing at Bottom

### Problem
A gray stripe appeared at the bottom of the screen every 1-2 seconds during polling, causing layout shift.

### Root Cause
The UNO button was conditionally rendered without a container, so when `myPlayer` was undefined during polling, the button disappeared/reappeared, causing the layout to shift.

### Solution
Wrapped the UNO button in an always-present container with fixed height:

```html
<div class="uno-button-container">
  {#if !myPlayer?.uno_declared}
    <button class="uno-button" on:click={declareUno}>UNO!</button>
  {/if}
</div>
```

```css
.uno-button-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 3rem;
  margin: 0.5rem 0;
}
```

## ✅ Issue 2: Card Dealing Animation

### Problem
When cards were dealt:
- All cards flew face-down simultaneously (300ms apart)
- They landed on top of each other
- After 5 seconds, they all popped into place face-up at once

### Solution
Changed to **truly sequential dealing**:

**Before:**
```javascript
setTimeout(animateNextCard, 300);  // Start next card 300ms after previous starts
setTimeout(() => {
  visibleHandSize++;
  flyingCards = flyingCards.filter(c => c.id !== cardId);
}, 5000);  // Reveal after 5 seconds
```

**After:**
```javascript
setTimeout(() => {
  visibleHandSize++;
  flyingCards = flyingCards.filter(c => c.id !== cardId);
  // Start next card AFTER this one is revealed
  setTimeout(animateNextCard, 100);
}, 800);  // Reveal after 0.8 seconds
```

### Result
✅ Cards dealt one at a time  
✅ Each card flies to position (0.8s)  
✅ Card turns face-up  
✅ Next card starts only after previous is face-up  
✅ Total deal time: ~0.9s per card (7 cards = ~6.3 seconds vs previous 5+ seconds of all cards stacked)
