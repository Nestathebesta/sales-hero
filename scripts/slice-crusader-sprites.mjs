/**
 * Builds a clean, game-ready crusader spritesheet from the labeled reference art.
 *
 * The source (`art-src/crusader-spritesheet.png`, 2048x2048) is a *reference sheet*: it has
 * titles ("CRUSADER IDLE"), per-frame "F1..F4" labels, and a flat gray background.
 * Naive 512px-grid slicing therefore captured title text, label fragments, and
 * off-center knights — which made the in-app idle jitter instead of breathe.
 *
 * This script instead:
 *   1. Removes the gray background via a border flood-fill (keeps interior armor).
 *   2. Finds the two knight rows (idle / attack) as the tallest content bands.
 *   3. Isolates each of the 8 knights by connected-component label (robust to the
 *      attack sword-swoosh that overlaps a neighbor's bounding box).
 *   4. Composites every knight onto a UNIFORM transparent cell — horizontally
 *      centered on its lower-body centroid and bottom-aligned to a fixed feet
 *      baseline, with one shared scale (no per-frame resize). The idle loop now
 *      breathes in place and every frame is centered.
 *
 * Outputs:
 *   public/assets/crusade/crusader-clean.png   (packed 4x2 sheet, CELL px cells)
 *   public/assets/crusade/frames/{idle,attack}-{0..3}.png   (individual cells)
 */
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const sheetPath = path.join(root, 'art-src/crusader-spritesheet.png');
const outDir = path.join(root, 'public/assets/crusade/frames');
const cleanSheetPath = path.join(root, 'public/assets/crusade/crusader-clean.png');

const BG_TOL = 42; // colour distance from background that still counts as "background"
const CELL_NATIVE = 900; // native-resolution working cell (square)
const FEET_FROM_BOTTOM = 72; // px from cell bottom to the feet baseline (native)
const LOWER_BODY_FRAC = 0.34; // bottom fraction used to find the horizontal body centre
const CELL_OUT = 256; // exported cell size (downscaled from native)
const COLS = 4;
const ROWS = 2;

function colorDist(r, g, b, R, G, B) {
  return Math.sqrt((r - R) ** 2 + (g - G) ** 2 + (b - B) ** 2);
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const { data, info } = await sharp(sheetPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels: ch } = info;

  // --- background colour from the outer border ring ---
  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  let n = 0;
  for (let x = 0; x < width; x += 4) {
    for (const y of [0, 1, 2, height - 1, height - 2, height - 3]) {
      const i = (y * width + x) * ch;
      bgR += data[i];
      bgG += data[i + 1];
      bgB += data[i + 2];
      n += 1;
    }
  }
  bgR = Math.round(bgR / n);
  bgG = Math.round(bgG / n);
  bgB = Math.round(bgB / n);

  // --- "outside" = background-coloured pixels reachable from the sheet border ---
  // Everything NOT outside is sprite (this keeps interior armour even where it is
  // close to the background grey, because the dark outline blocks the flood).
  const outside = new Uint8Array(width * height);
  const stack = [];
  const pushIfBg = (x, y) => {
    const idx = y * width + x;
    if (outside[idx]) return;
    const i = idx * ch;
    if (colorDist(data[i], data[i + 1], data[i + 2], bgR, bgG, bgB) <= BG_TOL) {
      outside[idx] = 1;
      stack.push(idx);
    }
  };
  for (let x = 0; x < width; x += 1) {
    pushIfBg(x, 0);
    pushIfBg(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    pushIfBg(0, y);
    pushIfBg(width - 1, y);
  }
  while (stack.length) {
    const idx = stack.pop();
    const x = idx % width;
    const y = (idx - x) / width;
    if (x > 0) pushIfBg(x - 1, y);
    if (x < width - 1) pushIfBg(x + 1, y);
    if (y > 0) pushIfBg(x, y - 1);
    if (y < height - 1) pushIfBg(x, y + 1);
  }

  const sprite = new Uint8Array(width * height);
  const rowProj = new Array(height).fill(0);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (!outside[idx]) {
        sprite[idx] = 1;
        rowProj[y] += 1;
      }
    }
  }

  // --- knight rows = the two tallest sustained content bands ---
  const runs = [];
  let start = -1;
  let gap = 0;
  for (let y = 0; y < height; y += 1) {
    if (rowProj[y] > width * 0.04) {
      if (start === -1) start = y;
      gap = 0;
    } else if (start !== -1) {
      gap += 1;
      if (gap > 12) {
        runs.push([start, y - gap]);
        start = -1;
      }
    }
  }
  if (start !== -1) runs.push([start, height - 1]);
  const bands = runs
    .sort((a, b) => b[1] - b[0] - (a[1] - a[0]))
    .slice(0, 2)
    .map(([y0, y1]) => ({ y0, y1 }))
    .sort((a, b) => a.y0 - b.y0);

  const BAND_NAMES = ['idle', 'attack'];

  // --- composited native sheet (RGBA, transparent) ---
  const sheetW = COLS * CELL_NATIVE;
  const sheetH = ROWS * CELL_NATIVE;
  const sheet = Buffer.alloc(sheetW * sheetH * 4, 0);
  const feetDestY = CELL_NATIVE - FEET_FROM_BOTTOM;

  const label = new Int32Array(width * height).fill(-1);

  bands.forEach((band, bandIdx) => {
    const { y0, y1 } = band;
    // connected components within this band
    const blobs = [];
    const bfs = [];
    for (let y = y0; y <= y1; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = y * width + x;
        if (!sprite[idx] || label[idx] !== -1) continue;
        const id = blobs.length;
        const pixels = [];
        bfs.length = 0;
        bfs.push(idx);
        label[idx] = id;
        let minX = x;
        let maxX = x;
        let minY = y;
        let maxY = y;
        while (bfs.length) {
          const p = bfs.pop();
          const px = p % width;
          const py = (p - px) / width;
          pixels.push(p);
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
          for (let dy = -1; dy <= 1; dy += 1) {
            for (let dx = -1; dx <= 1; dx += 1) {
              if (dx === 0 && dy === 0) continue;
              const nx = px + dx;
              const ny = py + dy;
              if (nx < 0 || nx >= width || ny < y0 || ny > y1) continue;
              const np = ny * width + nx;
              if (label[np] !== -1 || !sprite[np]) continue;
              label[np] = id;
              bfs.push(np);
            }
          }
        }
        blobs.push({ pixels, minX, maxX, minY, maxY });
      }
    }

    const knights = blobs
      .filter((b) => b.pixels.length > 4000)
      .sort((a, b) => a.minX - b.minX)
      .slice(0, COLS);

    knights.forEach((blob, frameIdx) => {
      // horizontal anchor = centroid of the lower body (legs/feet), which stays
      // put even when arms/swords swing out.
      const cutY = blob.maxY - (blob.maxY - blob.minY) * LOWER_BODY_FRAC;
      let sumX = 0;
      let cnt = 0;
      for (const p of blob.pixels) {
        const px = p % width;
        const py = (p - px) / width;
        if (py >= cutY) {
          sumX += px;
          cnt += 1;
        }
      }
      const bodyCX = cnt ? sumX / cnt : (blob.minX + blob.maxX) / 2;

      const cellOriginX = frameIdx * CELL_NATIVE;
      const cellOriginY = bandIdx * CELL_NATIVE;
      const offX = Math.round(cellOriginX + CELL_NATIVE / 2 - bodyCX);
      const offY = Math.round(cellOriginY + feetDestY - blob.maxY);

      for (const p of blob.pixels) {
        const px = p % width;
        const py = (p - px) / width;
        const dx = px + offX;
        const dy = py + offY;
        if (dx < cellOriginX || dx >= cellOriginX + CELL_NATIVE) continue;
        if (dy < cellOriginY || dy >= cellOriginY + CELL_NATIVE) continue;
        const si = p * ch;
        const di = (dy * sheetW + dx) * 4;
        sheet[di] = data[si];
        sheet[di + 1] = data[si + 1];
        sheet[di + 2] = data[si + 2];
        sheet[di + 3] = 255;
      }

      console.log(
        `${BAND_NAMES[bandIdx]}-${frameIdx}: bodyCX=${Math.round(bodyCX)} feet=${blob.maxY} px=${blob.pixels.length}`
      );
    });
  });

  // --- downscale the native sheet to the exported cell size & write outputs ---
  const outSheetW = COLS * CELL_OUT;
  const outSheetH = ROWS * CELL_OUT;
  const nativeSheet = sharp(sheet, {
    raw: { width: sheetW, height: sheetH, channels: 4 },
  });
  await nativeSheet
    .clone()
    .resize(outSheetW, outSheetH, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toFile(cleanSheetPath);
  console.log(`\nWrote ${path.relative(root, cleanSheetPath)} (${outSheetW}x${outSheetH})`);

  // individual frames (re-extract from the freshly written clean sheet)
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const name = `${BAND_NAMES[row]}-${col}.png`;
      await sharp(cleanSheetPath)
        .extract({ left: col * CELL_OUT, top: row * CELL_OUT, width: CELL_OUT, height: CELL_OUT })
        .png()
        .toFile(path.join(outDir, name));
    }
  }
  console.log(`Wrote 8 frames at ${CELL_OUT}x${CELL_OUT} in public/assets/crusade/frames/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
