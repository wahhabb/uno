# UNO Game Sound Effects

## Overview

This directory contains sound effects for the UNO game to enhance the player experience.

## Required Sounds

1. **card-flip.mp3** - Played when dealing, playing, or drawing a card
2. **card-shuffle.mp3** - Played at game start when deck is shuffled
3. **button-click.mp3** - Played when UNO button is pressed
4. **special-card.mp3** - Played for skip, reverse, or draw cards
5. **win.mp3** - Celebration sound when a player wins
6. **error.mp3** - Brief error tone for invalid moves

## Recommended Sound Sources

### 1. Freesound.org (Best Option)
- **URL**: https://freesound.org
- **License**: Most sounds are CC0 (public domain) or CC-BY (attribution required)
- **Quality**: High-quality, community-created sounds
- **Search tips**:
  - "card flip" → card-flip.mp3
  - "card shuffle" → card-shuffle.mp3
  - "button click" → button-click.mp3
  - "magic whoosh" → special-card.mp3
  - "win fanfare" → win.mp3
  - "error beep" → error.mp3

### 2. Zapsplat.com
- **URL**: https://www.zapsplat.com
- **License**: Free tier available with attribution
- **Quality**: Professional sound effects
- **Registration**: Free account required

### 3. OpenGameArt.org
- **URL**: https://opengameart.org
- **License**: Various open licenses
- **Quality**: Game-focused sound effects
- **Search**: "card game sounds" or "UI sounds"

### 4. Mixkit.co
- **URL**: https://mixkit.co/free-sound-effects/
- **License**: Free for commercial use
- **Quality**: Professional quality
- **No registration required**

## Download Instructions

### For Freesound.org:
1. Go to https://freesound.org
2. Create a free account (if needed)
3. Search for each sound type
4. Filter by license (prefer CC0 for simplicity)
5. Preview sounds and download
6. Rename to match our naming convention
7. Convert to MP3 if needed (keep file size under 100KB each)

### Sample Search Queries:
- Card flip: "card flip", "card draw", "paper flip"
- Card shuffle: "card shuffle", "deck shuffle"
- Button: "button click", "UI click", "pop"
- Special card: "whoosh", "magic", "spell"
- Win: "victory", "fanfare", "win", "success"
- Error: "error", "wrong", "buzz", "beep"

## File Format

- **Format**: MP3 (best browser compatibility)
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Rate**: 128-192 kbps (balance quality and size)
- **Max Size**: Try to keep each file under 100KB

## Converting Audio Files

If you download in other formats (WAV, OGG), convert to MP3:

### Using FFmpeg (command line):
```bash
# Install ffmpeg (if needed)
# macOS: brew install ffmpeg
# Windows: Download from ffmpeg.org

# Convert to MP3
ffmpeg -i input.wav -codec:a libmp3lame -qscale:a 2 output.mp3
```

### Online Converters:
- https://cloudconvert.com/audio-converter
- https://online-audio-converter.com

## Audio Implementation

Sounds will be loaded and managed via an audio store in the app:

```typescript
// src/lib/stores/audio.ts
export const audioStore = {
  playCardFlip: () => new Audio('/assets/sounds/card-flip.mp3').play(),
  playCardShuffle: () => new Audio('/assets/sounds/card-shuffle.mp3').play(),
  playButtonClick: () => new Audio('/assets/sounds/button-click.mp3').play(),
  playSpecialCard: () => new Audio('/assets/sounds/special-card.mp3').play(),
  playWin: () => new Audio('/assets/sounds/win.mp3').play(),
  playError: () => new Audio('/assets/sounds/error.mp3').play()
};
```

## License Tracking

Keep track of licenses for compliance:

| File | Source | License | Attribution Required |
|------|--------|---------|---------------------|
| card-flip.mp3 | [URL] | [License] | [Yes/No] |
| card-shuffle.mp3 | [URL] | [License] | [Yes/No] |
| button-click.mp3 | [URL] | [License] | [Yes/No] |
| special-card.mp3 | [URL] | [License] | [Yes/No] |
| win.mp3 | [URL] | [License] | [Yes/No] |
| error.mp3 | [URL] | [License] | [Yes/No] |

## Attribution

If using CC-BY licensed sounds, add attribution in your app's footer or about page:
```
Sound effects from Freesound.org:
- "Card Flip" by [username]
- "Card Shuffle" by [username]
...
```

## Volume Levels

When implementing, set appropriate volume levels:
- Card flip: 0.5 (moderate)
- Card shuffle: 0.6 (moderate)
- Button click: 0.4 (quiet)
- Special card: 0.7 (louder for emphasis)
- Win: 0.8 (celebration!)
- Error: 0.3 (subtle)

## Testing Checklist

After adding sounds:
- [ ] All sounds load without errors
- [ ] Sounds play at appropriate times
- [ ] Volume levels are balanced
- [ ] No audio clipping or distortion
- [ ] Works across browsers (Chrome, Safari, Firefox)
- [ ] Mobile devices can play sounds
- [ ] File sizes are optimized

## Optional: Mute Toggle

Consider adding a mute button for players who prefer to play silently:
```typescript
let isMuted = false;

function playSound(audio: HTMLAudioElement) {
  if (!isMuted) {
    audio.play();
  }
}
```

## Next Steps

1. Visit recommended sources
2. Download 6 sound files
3. Rename according to conventions
4. Convert to MP3 if needed
5. Optimize file sizes
6. Test in the app
7. Document licenses
