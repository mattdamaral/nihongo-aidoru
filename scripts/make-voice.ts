// Records every card's Japanese with VOICEVOX into public/voice/<slug>.mp3. Run with: npm run voice
// Needs the VOICEVOX app open (its engine listens on 127.0.0.1:50021) and ffmpeg on the PATH.
// Existing clips are kept; pass --force to record them all again.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const ENGINE = process.env.VOICEVOX_URL ?? 'http://127.0.0.1:50021';
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = fileURLToPath(new URL('../public/voice/', import.meta.url));
const force = process.argv.includes('--force');

// A little slower than normal speech, with short silences so clips start and stop quickly.
const TUNING = {
  speedScale: 0.9,
  prePhonemeLength: 0.08,
  postPhonemeLength: 0.12,
  outputSamplingRate: 24000,
  outputStereo: false,
};

interface Card {
  deck: string;
  kana: string;
  romaji: string;
}

const toKatakana = (text: string) => text.replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));

// The card data uses extension-less imports, so load it through Vite like the app does.
const vite = await createServer({ root: ROOT, configFile: false, logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const { ALL_CARDS } = (await vite.ssrLoadModule('/src/data/cards.ts')) as { ALL_CARDS: Card[] };
const voice = (await vite.ssrLoadModule('/src/data/voice.ts')) as {
  voiceSlug(card: Card): string;
  toHiragana(text: string): string;
  VOICE_SPEAKER: { name: string; style: string };
  VOICE_CREDIT: string;
};
await vite.close();

async function engine(path: string, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(`${ENGINE}${path}`, init);
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res;
  } catch (err) {
    if (err instanceof TypeError) {
      console.error(`Can't reach VOICEVOX at ${ENGINE}. Open the VOICEVOX app first, then run this again.`);
      process.exit(1);
    }
    throw err;
  }
}

const speakers = (await (await engine('/speakers')).json()) as { name: string; styles: { name: string; id: number }[] }[];
const speakerId = speakers
  .find((s) => s.name === voice.VOICE_SPEAKER.name)
  ?.styles.find((s) => s.name === voice.VOICE_SPEAKER.style)?.id;
if (speakerId === undefined) {
  console.error(`VOICEVOX has no ${voice.VOICE_SPEAKER.name} / ${voice.VOICE_SPEAKER.style}. Is that voice installed?`);
  process.exit(1);
}

/** WAV in, MP3 out (mono, 48 kbps: small, and plenty for speech). */
function encode(wav: Buffer, file: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ff = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'wav', '-i', 'pipe:0', '-ac', '1', '-b:a', '48k', file]);
    ff.on('error', reject);
    ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited with ${code}`))));
    ff.stdin.end(wav);
  });
}

// One clip per sound: the first card with each slug says it for all of them.
// Kana and numbers go in as katakana: in hiragana, a lone は is read as the particle "wa" (and へ as "e"),
// and so is the は in はち. Greetings stay in hiragana, where こんにちは should end in "wa".
const clips = new Map<string, string>();
for (const card of ALL_CARDS) {
  const slug = voice.voiceSlug(card);
  const asSounds = card.deck !== 'greetings';
  if (!clips.has(slug)) clips.set(slug, asSounds ? toKatakana(card.kana) : voice.toHiragana(card.kana));
}

mkdirSync(OUT, { recursive: true });
let made = 0;
for (const [slug, text] of clips) {
  const file = `${OUT}${slug}.mp3`;
  if (!force && existsSync(file)) continue;
  const query = (await (await engine(`/audio_query?speaker=${speakerId}&text=${encodeURIComponent(text)}`, { method: 'POST' })).json()) as Record<string, unknown>;
  Object.assign(query, TUNING);
  const wav = Buffer.from(
    await (
      await engine(`/synthesis?speaker=${speakerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
      })
    ).arrayBuffer(),
  );
  await encode(wav, file);
  made++;
  // The engine's own reading, to check odd ones (e.g. a lone を or ん) by eye.
  console.log(`${slug.padEnd(24)} ${text}  →  ${String(query.kana)}`);
}

writeFileSync(
  `${OUT}CREDITS.txt`,
  `Voice clips: ${voice.VOICE_CREDIT} (${voice.VOICE_SPEAKER.style})\nMade with VOICEVOX, https://voicevox.hiroshiba.jp/ — see scripts/make-voice.ts.\n`,
);
const bytes = readdirSync(OUT)
  .filter((f) => f.endsWith('.mp3'))
  .reduce((sum, f) => sum + statSync(`${OUT}${f}`).size, 0);
console.log(`\n${made} new clips, ${clips.size} in all, ${(bytes / 1024 / 1024).toFixed(2)} MB.`);
