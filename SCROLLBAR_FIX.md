# Scrollbar Flash Fix

## Problem
A vertical scrollbar was appearing and disappearing every 1-2 seconds during polling, causing a gray stripe on the right side of the screen and making content shift left/right.

## Root Cause
Page content was temporarily exceeding 100vh during polling cycles, triggering the browser's automatic scrollbar, which then disappeared when content shrank back, causing layout shift.

## Solution - Two-Part Fix

### 1. Game Page (`src/routes/game/[id]/+page.svelte`)
Prevented the game page from exceeding viewport height:

```css
main {
  height: 100vh;        /* Changed from min-height */
  max-height: 100vh;    /* Added to cap height */
  overflow: hidden;     /* Added to prevent scrolling */
  /* ... other styles ... */
}
```

### 2. Global Styles (`src/app.css`)
Always reserve space for scrollbar across entire app:

```css
body {
  /* ... other styles ... */
  overflow-y: scroll;  /* Always show scrollbar gutter */
}
```

## Result
✅ Scrollbar gutter always reserved (even when empty)  
✅ No more appearing/disappearing scrollbar  
✅ No more layout shift or gray stripe flash  
✅ Content never shifts left/right during polling
