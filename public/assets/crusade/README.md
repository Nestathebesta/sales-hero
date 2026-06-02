# Crusade art assets

## Active spritesheet

| File | Description |
|------|-------------|
| `crusader-clean.png` | **Runtime sheet** — 1024×512, 256px transparent cells, 4 cols × 2 rows. Row 0 = **Idle** (4 frames), row 1 = **Attack** (4 frames). Every knight is background-removed, centered on its body, and bottom-aligned to a shared feet baseline. |
| `frames/idle-0..3.png` | Individual 256×256 idle cells (debug/inspection) |
| `frames/attack-0..3.png` | Individual 256×256 attack cells |
| `crusader-spritesheet.png` | **Source reference art** (2048×2048) — labeled with titles + "F1..F4" and a flat gray background. Not used at runtime; it is the input to the generator. |

Generate the clean sheet + frames from the source with `npm run sprites:slice`
(`scripts/slice-crusader-sprites.mjs`). Layout is configured in
`src/game/crusaderSpriteSheet.js` (`SOURCE_FRAME_SIZE = 256`).

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
