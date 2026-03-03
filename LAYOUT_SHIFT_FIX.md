# Layout Shift Bug Fix

## 🐛 Problem
Every 1 second during polling, the screen would bounce/shift when errors appeared or cleared, creating a "light-colored band" (the error banner) that pushed content up or down.

## 🔍 Root Cause
The error banner was conditionally rendered:
```svelte
{#if error}
  <div class="error-banner">{error}</div>
{/if}
```

When an error occurred, this element was **added to the DOM**, causing the page to expand and shift. When the error cleared, it was **removed from the DOM**, causing another shift.

## ✅ Solution
Made the error banner **always present** (like the other notification banners), but invisible when not needed:

**HTML:**
```svelte
<!-- Error banner - always present to prevent layout shift -->
<div class="error-banner" class:visible={error}>
  {#if error}
    {error}
  {:else}
    &nbsp;
  {/if}
</div>
```

**CSS:**
```css
.error-banner {
  background: transparent;
  color: transparent;
  min-height: 3rem;  /* Reserves space */
  transition: all 0.3s ease-in-out;
}

.error-banner.visible {
  background: #e74c3c;
  color: white;
  border-color: white;
}
```

## 📊 Result
- ✅ No more layout shifts during polling
- ✅ Error messages still display when needed
- ✅ Smooth transitions between states
- ✅ Consistent with other notification banners (turn, skip, animation)
