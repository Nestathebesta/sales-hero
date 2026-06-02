/**
 * Slices the crusader spritesheet into individual 512×512 frames (displayed at 64px in-game).
 * Source: public/assets/crusade/crusader-spritesheet.png (2048×2048, 4×2 grid)
 */
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const sheetPath = path.join(root, 'public/assets/crusade/crusader-spritesheet.png');
const outDir = path.join(root, 'public/assets/crusade/frames');

const FRAME = 512;
const COLS = 4;

const ROWS = [
  { name: 'idle', row: 0 },
  { name: 'attack', row: 1 },
];

async function main() {
  await mkdir(outDir, { recursive: true });

  for (const { name, row } of ROWS) {
    for (let col = 0; col < COLS; col += 1) {
      const left = col * FRAME;
      const top = row * FRAME;
      const outPath = path.join(outDir, `${name}-${col}.png`);

      await sharp(sheetPath)
        .extract({ left, top, width: FRAME, height: FRAME })
        .resize(64, 64, { kernel: sharp.kernel.nearest })
        .png()
        .toFile(outPath);

      console.log(`Wrote ${path.relative(root, outPath)}`);
    }
  }

  console.log('Done — 8 frames at 64×64 in public/assets/crusade/frames/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
