# Crusade art assets

## Active spritesheet

| File | Description |
|------|-------------|
| `crusader-spritesheet.png` | 2048×2048 sheet — row 0 = **Idle** (4 frames), row 1 = **Attack** (4 frames) |
| `frames/idle-0..3.png` | Pre-sliced 64×64 idle frames (`npm run sprites:slice`) |
| `frames/attack-0..3.png` | Pre-sliced 64×64 attack frames |

Grid parsing is configured in `src/game/crusaderSpriteSheet.js` (`SOURCE_FRAME_SIZE = 512`).

## Animation (CrusaderSprite)

- **Idle:** loops frames 0–3 on the top row
- **Attack:** on `salesState.closedDeal`, plays bottom row once; frame 4 (index 3) is the bridge back to idle

## Optional future assets

| File | Use |
|------|-----|
| `hero-bg.webp` | Full-page background |
| `panel-frame.png` | Panel border overlay |
| Race-specific sheets | `elf-spritesheet.png`, etc. |

Drop new sheets here and update `crusaderSpriteSheet.js` row/column maps.
