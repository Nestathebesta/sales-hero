/**
 * Crusader horizontal spritesheet layout (2048×2048 source, 4×2 grid of 512px cells).
 * Display targets 64×64 logical pixels (scaled on canvas).
 *
 * Row 0 — Idle loop (4 frames, breathing)
 * Row 1 — Attack sequence (4 frames; frame 4 bridges back to idle frame 1)
 */

export const CRUSADER_SPRITE_SHEET = '/assets/crusade/crusader-spritesheet.png';

/** Source pixel size of each cell in the sheet */
export const SOURCE_FRAME_SIZE = 512;

/** Logical / on-screen frame size (64×64 grid) */
export const DISPLAY_FRAME_SIZE = 64;

/** Default canvas render scale (64 → 128px for retina clarity) */
export const DISPLAY_SCALE = 2;

export const SHEET_COLS = 4;

/** @typedef {{ col: number, row: number }} SpriteCell */

/** @type {SpriteCell[]} */
export const IDLE_LOOP = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 2, row: 0 },
  { col: 3, row: 0 },
];

/** @type {SpriteCell[]} */
export const ATTACK_LOOP = [
  { col: 0, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 3, row: 1 },
];

/** 4th attack frame — hold before resuming idle */
export const ATTACK_BRIDGE_INDEX = 3;

export const IDLE_RESTART_INDEX = 0;

export const ANIM_TIMING = {
  idleFrameMs: 180,
  attackFrameMs: 110,
  bridgeHoldMs: 280,
};

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLImageElement} image
 * @param {SpriteCell} cell
 * @param {number} destSize
 */
export function drawSpriteCell(ctx, image, cell, destSize = DISPLAY_FRAME_SIZE) {
  const sx = cell.col * SOURCE_FRAME_SIZE;
  const sy = cell.row * SOURCE_FRAME_SIZE;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, destSize, destSize);
  ctx.drawImage(
    image,
    sx,
    sy,
    SOURCE_FRAME_SIZE,
    SOURCE_FRAME_SIZE,
    0,
    0,
    destSize,
    destSize
  );
}
