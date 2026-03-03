# UNO Card SVG Assets

## Overview

This directory contains SVG card images for the UNO game. Cards are organized by color and type for easy reference in the game code.

## Card Download Source

Download UNO card SVGs from: **https://creazilla.com/media/clipart/uno**

## Required Cards (108 total)

### Number Cards (76 cards)
Each color (red, blue, green, yellow) needs:
- 1x card with value 0
- 2x cards with values 1-9

### Action Cards (24 cards)
Each color needs 2 of each:
- Skip
- Reverse
- Draw Two (+2)

### Wild Cards (8 cards)
- 4x Wild (no color)
- 4x Wild Draw Four (+4, no color)

## File Naming Convention

Use this naming convention for consistency:

```
red-0.svg, red-1.svg, red-2.svg, ... red-9.svg
red-skip.svg
red-reverse.svg
red-draw-two.svg

blue-0.svg, blue-1.svg, ... blue-9.svg
blue-skip.svg
blue-reverse.svg
blue-draw-two.svg

green-0.svg, green-1.svg, ... green-9.svg
green-skip.svg
green-reverse.svg
green-draw-two.svg

yellow-0.svg, yellow-1.svg, ... yellow-9.svg
yellow-skip.svg
yellow-reverse.svg
yellow-draw-two.svg

wild.svg
wild-draw-four.svg

back.svg (card back for draw pile)
```

## Folder Structure

```
static/assets/cards/
├── README.md (this file)
├── red-0.svg
├── red-1.svg
├── ...
├── blue-0.svg
├── ...
├── green-0.svg
├── ...
├── yellow-0.svg (already added as yellow-2-card-clipart.svg)
├── ...
├── wild.svg
├── wild-draw-four.svg
└── back.svg
```

## Download Instructions

1. Visit https://creazilla.com/media/clipart/uno
2. Search for each card type and color
3. Download as SVG format
4. Rename files according to the naming convention above
5. Place in this directory

## Alternative Sources

If Creazilla doesn't have all cards, try:
- **OpenGameArt.org** - Search for "uno cards"
- **Wikimedia Commons** - Public domain card designs
- **Custom Creation** - Use Figma or Illustrator to create matching designs

## Image Optimization

After downloading, optionally optimize SVGs:
```bash
npm install -g svgo
svgo --folder=static/assets/cards
```

## License Verification

Before deploying to production:
1. Verify all card images have appropriate licenses
2. Ensure commercial use is allowed
3. Credit sources if required by license
4. Consider creating custom designs if licensing is unclear

## Implementation Note

Cards are referenced in the code using the Card interface:
```typescript
interface Card {
  id: string;
  type: 'number' | 'skip' | 'reverse' | 'draw_two' | 'wild' | 'wild_draw_four';
  color: 'red' | 'blue' | 'green' | 'yellow' | null;
  value?: number; // 0-9 for number cards
}
```

The SVG path is constructed as:
```typescript
const cardPath = card.color
  ? `/assets/cards/${card.color}-${card.type === 'number' ? card.value : card.type}.svg`
  : `/assets/cards/${card.type}.svg`;
```
