/**
 * Generates rank-appearance tokens for the Crusader Card.
 *
 * Each token is the clean crusader sprite tinted to a single rank colour
 * (a heraldic monochrome relief) set on a dark medallion with a rank-coloured
 * ring. This replaces the muddy, repeated dungeon-portrait avatars with crisp,
 * clearly-distinct rank emblems drawn from the same art as the hero sprite.
 *
 * Output: public/avatars/rank-{squire,knight,crusader,commander}.png
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const knightPath = path.join(root, 'public/assets/crusade/frames/idle-0.png');
const outDir = path.join(root, 'public/avatars');

const SIZE = 256;
const KNIGHT = 200;

const RANKS = [
  { id: 'squire', tint: { r: 178, g: 193, b: 214 }, ring: '#aab8cc', glow: '#5d6e85' },
  { id: 'knight', tint: { r: 96, g: 142, b: 242 }, ring: '#5b8af0', glow: '#3d6fd6' },
  { id: 'crusader', tint: { r: 228, g: 198, b: 92 }, ring: '#e3c45a', glow: '#d4af37' },
  { id: 'commander', tint: { r: 226, g: 88, b: 108 }, ring: '#e0566a', glow: '#a33040' },
];

function medallionSvg({ ring, glow }) {
  return Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="68%">
      <stop offset="0%" stop-color="${glow}" stop-opacity="0.30"/>
      <stop offset="52%" stop-color="#0c1220" stop-opacity="1"/>
      <stop offset="100%" stop-color="#070b14" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <circle cx="128" cy="128" r="122" fill="url(#bg)"/>
  <circle cx="128" cy="128" r="122" fill="none" stroke="#05080f" stroke-width="6"/>
  <circle cx="128" cy="128" r="119" fill="none" stroke="${ring}" stroke-width="4" stroke-opacity="0.9"/>
  <circle cx="128" cy="128" r="110" fill="none" stroke="${ring}" stroke-width="1.5" stroke-opacity="0.35"/>
</svg>`);
}

async function main() {
  for (const rank of RANKS) {
    const medallion = await sharp(medallionSvg(rank)).png().toBuffer();

    const knight = await sharp(knightPath)
      .resize(KNIGHT, KNIGHT, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .tint(rank.tint) // monochrome relief in the rank colour (luminance preserved)
      .png()
      .toBuffer();

    const out = path.join(outDir, `rank-${rank.id}.png`);
    await sharp(medallion)
      .composite([{ input: knight, left: Math.round((SIZE - KNIGHT) / 2), top: 32 }])
      .png()
      .toFile(out);
    console.log(`Wrote ${path.relative(root, out)}`);
  }
  console.log('Done — 4 rank tokens in public/avatars/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
