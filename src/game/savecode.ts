import { parseState, type GameState } from './state';

// Format: NA1.<base64url(deflate-raw(JSON))>.<checksum>
// "." separates parts because base64url itself uses "-" and "_".
const PREFIX = 'NA1';

export class SaveCodeError extends Error {}

async function transform(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** FNV-1a, shortened to 6 hex digits: enough to catch typos and truncation. */
function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) & 0xffffff).toString(16).padStart(6, '0').toUpperCase();
}

export async function exportCode(state: GameState): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(state));
  const body = toBase64Url(await transform(json, new CompressionStream('deflate-raw')));
  return `${PREFIX}.${body}.${checksum(body)}`;
}

/** Decodes a save code; throws SaveCodeError with a player-facing message. */
export async function importCode(code: string): Promise<GameState> {
  const parts = code.replace(/\s+/g, '').split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX) {
    throw new SaveCodeError('That doesn’t look like a Nihongo Aidoru save code.');
  }
  const [, body, sum] = parts as [string, string, string];
  if (checksum(body) !== sum.toUpperCase()) {
    throw new SaveCodeError('The code is incomplete or has a typo. Try copying it again.');
  }
  try {
    const json = new TextDecoder().decode(await transform(fromBase64Url(body), new DecompressionStream('deflate-raw')));
    const state = parseState(JSON.parse(json));
    if (state) return state;
  } catch {
    // Falls through to the error below.
  }
  throw new SaveCodeError('The code couldn’t be read. It may be from a newer version of the game.');
}
