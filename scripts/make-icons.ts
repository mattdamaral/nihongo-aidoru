// Renders the nigiri sprite into the PWA icons. Run with: npm run icons
// Uses only Node built-ins (zlib for PNG compression) so no image library is needed.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { NIGIRI, spriteSvg, type Sprite } from '../src/ui/sprites.ts';

const OUT = new URL('../public/icons/', import.meta.url);
const BG = '#14121f';

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

/** Draws `sprite` centered on a square background, `fill` = share of the icon the sprite spans. */
function renderPng(sprite: Sprite, size: number, fill: number): Buffer {
  const cells = sprite.grid.length;
  const scale = Math.floor((size * fill) / cells);
  const offset = Math.floor((size - cells * scale) / 2);
  const bg = hex(BG);
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    raw[row] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const gx = Math.floor((x - offset) / scale);
      const gy = Math.floor((y - offset) / scale);
      const ch = x >= offset && y >= offset ? sprite.grid[gy]?.[gx] : undefined;
      const color = ch ? sprite.palette[ch] : undefined;
      const [r, g, b] = color ? hex(color) : bg;
      raw.set([r!, g!, b!], row + 1 + x * 3);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT, { recursive: true });
// 0.75 keeps the sushi inside the maskable-icon safe zone.
writeFileSync(new URL('icon-192.png', OUT), renderPng(NIGIRI, 192, 0.75));
writeFileSync(new URL('icon-512.png', OUT), renderPng(NIGIRI, 512, 0.75));
writeFileSync(new URL('apple-touch-icon.png', OUT), renderPng(NIGIRI, 180, 0.8));
writeFileSync(new URL('favicon.svg', OUT), spriteSvg(NIGIRI));
console.log('Icons written to public/icons/');
