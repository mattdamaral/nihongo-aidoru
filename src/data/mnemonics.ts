import { GROUPS, type Kana } from './kana';

export interface Mnemonic {
  tips: string[];
  /** Kana of the same script that are easy to mix up with this one. */
  confuse: string[];
}

type Entry = [tips: string[], confuse?: string[]];

// Hand-written tips for the 46 basic kana of each script.
const BASIC: Record<string, Entry> = {
  // Hiragana
  あ: [['An apple on a stick: the cross is the stem, the loop is the apple. A for apple.', 'A person stretching after a nap with a big “Aaah!”'], ['お']],
  い: [['Two eels swimming side by side: “eel” → i.', 'Two short sticks side by side, like the “ii” in “skiing”.'], ['り']],
  う: [['A sideways “U” with a little hat on top.', 'An ear with a dot above it, hearing someone say “ooh”.'], ['ら', 'つ']],
  え: [['An exotic bird with a crest on its head: exotic → e.', 'Someone running with arms flailing: “Eh?! Wait for me!”'], ['ん']],
  お: [['Like あ, but the loop broke open and a drop flew off: “Oh no!”', 'A golfer mid-swing, the dot is the ball: “Ohhh, hole in one!”'], ['あ', 'を']],
  か: [['A karate chop with a spark flying off: “KA!”', 'A blade and a cutting sound: ka-chunk.'], ['や']],
  き: [['A key: the long stroke is the shaft, the two bars are its teeth, the bottom curl is the ring.', 'It even sounds like “key”.'], ['さ', 'ち']],
  く: [['A cuckoo’s beak open sideways: “ku-ku!”', 'One sharp bend, like an elbow in a karate chop: “kuh!”'], ['へ']],
  け: [['A keg on the right with a tap stand on the left.', 'A kettle: handle on the left, spout on the right.'], ['は', 'に']],
  こ: [['Two koi fish swimming one above the other.', 'Two coins seen from the side, stacked.'], ['い', 'に']],
  さ: [['A fishing rod (the cross) with a salmon caught on the hook below.', 'Like き but with only one bar: sa saves a stroke.'], ['き', 'ち']],
  し: [['A fishhook — “shhh!”, don’t scare the fish.', 'An upside-down shepherd’s crook: she-pherd.'], ['つ']],
  す: [['A noodle twirled around a chopstick, ready to be slurped: “sssu!”', 'A kid on a swing going all the way round the bar. Super fun!'], ['む', 'お']],
  せ: [['A set of shelves: one long shelf held up by two legs, one bent.', 'Same sound as katakana セ — this one just has an extra leg.'], ['さ']],
  そ: [['A zigzag thread: you “sew” (so) with it.', 'A lightning bolt dropping into a bowl of soup.'], ['ろ', 'る']],
  た: [['The left half is a “t”, the right half a squashed “a”: t + a = ta.', 'A tall man (the cross) standing next to two little stools.'], ['な', 'に']],
  ち: [['Like the number 5 missing a piece — someone ate the chip.', 'A big round belly from eating too many chips.'], ['さ', 'ら']],
  つ: [['The curl of a tsunami wave.', 'A “U” knocked onto its side: ts-U.'], ['し', 'う']],
  て: [['A hand reaching out — and “te” (手) is the Japanese word for hand.', 'A table with one bent leg, teetering.'], []],
  と: [['A toe with a thorn stuck in it: the short stroke is the thorn.', 'Katakana ト with an extra hook — same sound, to.'], []],
  な: [['Like た with a knot tied in it: tie a k-NOT → na.', 'A nail (the cross) with string looped around it.'], ['た', 'よ']],
  に: [['A stick leaning on two steps, like a bent knee: knee → ni.', 'A stick next to ニ, which is the kanji for two (ni).'], ['こ', 'け', 'た']],
  ぬ: [['Noodles in chopsticks: crossed sticks, a long noodle with a curly tail.', 'Like め but with a little loop at the end — the noodle’s curl.'], ['め', 'ね']],
  ね: [['A cat (neko) napping with its tail curled at the end.', 'Same stick as れ and わ, but ending in a little loop: a nest.'], ['れ', 'わ', 'ぬ']],
  の: [['A big “no” sign: a circle with a slash through it.', 'One swirl — you’ll see it everywhere as the particle の (“of”, “’s”).'], ['め']],
  は: [['A capital “H” and a little “a” squashed together: h + a.', 'As the topic particle it’s read “wa” — “Ha, wait, it’s a particle!”'], ['ほ', 'け']],
  ひ: [['A wide grin laughing “hee hee!”', 'A pair of hips sitting in a chair.'], []],
  ふ: [['Mount Fuji: a peak on top and slopes spreading out below.', 'A face blowing out birthday candles: “foo!”'], []],
  へ: [['A tiny hill: “Hey, let’s climb it!”', 'Almost the same as katakana ヘ. As the particle へ (“towards”) it’s read “e”.'], ['く']],
  ほ: [['は with a roof bar on top: a house (ho-use).', 'Santa (“Ho ho ho!”) hung two stockings on the post.'], ['は', 'ま']],
  ま: [['A ship’s mast with two sails and a loop of rope at the bottom.', 'A mama with a baby curled up in her belly.'], ['も', 'ほ', 'よ']],
  み: [['Looks like a cursive “21” — you turn 21 and it’s all about ME.', 'A messy ribbon tied in a knot.'], []],
  む: [['A cow’s face looking sideways with its ear sticking out: “moo!”', 'す’s cousin with an extra tick: su says hi, mu says moo.'], ['す', 'お']],
  め: [['An eye — and “me” (目) is the Japanese word for eye.', 'Like ぬ without the little end loop: me is the plain one.'], ['ぬ', 'あ', 'の']],
  も: [['A fishhook with two worms on it: catch more fish.', 'Like し with two bars added: shi needs MORE lines.'], ['し', 'ま']],
  や: [['A yak’s curved horn with a little leg below.', 'Katakana ヤ plus a dash — same sound, ya.'], ['か']],
  ゆ: [['The sign hung on Japanese hot-spring baths: ゆ (湯) means hot water. The curl is steam.', 'A fish swimming past a post: “You see that fish?”'], ['よ']],
  よ: [['A yo-yo hanging from its string, the loop at the bottom.', 'A “Y” with a loop tied in its tail: y + o.'], ['ま', 'ほ']],
  ら: [['A rabbit with one ear up (the dash) and a round body.', 'A slurp of ramen with a chopstick dash on top.'], ['う', 'ち', 'ろ']],
  り: [['Two reeds by a river, the right one taller.', 'Like い but the right stroke is long, like a river flowing down.'], ['い']],
  る: [['A route that loops back home at the end.', 'Like ろ but with a loop on the tail — a ruby ring.'], ['ろ', 'そ']],
  れ: [['Someone leaning back to relax, one leg kicked out.', 'Same stick as ね and わ, but its tail kicks up and out like a relay runner.'], ['わ', 'ね']],
  ろ: [['A road that bends like the number 3.', 'Like る without the loop: ro is the plain road, ru has the roundabout.'], ['る', 'そ']],
  わ: [['A person hugging a big water bottle.', 'Same stick as ね and れ, but its tail curls back in like a wave.'], ['れ', 'ね']],
  を: [['Only used as the object particle and said “o” — “WOah, an object!”', 'A person mid-backflip with arms crossed: “Whoa!”'], ['お']],
  ん: [['A lowercase “n” with a tail.', 'The only kana that’s just a sound on its own — it ends syllables, as in ほん (hon, book).'], []],

  // Katakana
  ア: [['An axe swinging down: “Aaa!”', 'A wonky capital A tipping over to the left.'], ['マ', 'ヤ']],
  イ: [['An easel: one leaning leg and one straight leg.', 'Like the “person” radical 亻 — I am a person.'], ['ト']],
  ウ: [['Like hiragana う with a little chimney on top.', 'A “U” wearing a hat.'], ['ワ', 'フ', 'ラ']],
  エ: [['A steel I-beam used in engineering.', 'An elevator shaft: a top floor and a bottom floor joined in the middle.'], ['ユ']],
  オ: [['An opera singer with arms spread wide.', 'Hiragana お without the loop and dot: just the cross and a slash.'], ['ホ', 'ネ']],
  カ: [['Hiragana か without the spark.', 'Looks like the kanji 力 (power): a karate chop with power.'], ['ク']],
  キ: [['A key: two teeth on a long shaft.', 'Hiragana き without the bottom curl.'], ['チ', 'モ']],
  ク: [['A cuckoo’s beak seen from above.', 'Like a 7 with a tail — and 九 (nine) can be read “ku”.'], ['ケ', 'タ', 'ワ']],
  ケ: [['A capital K tipped over: K for ke.', 'A kebab skewer with the meat sliding off.'], ['ク']],
  コ: [['The corner of a box seen from the side.', 'Hiragana こ with its two lines joined on the right.'], ['ユ', 'ロ']],
  サ: [['A saddle: two posts holding up a long bar.', 'The top of hiragana さ, straightened out.'], ['セ', 'ヤ']],
  シ: [['A smiling face: she looks up. Dots sit side by side, stroke sweeps UP.', 'Like ミ (mi) but the bottom line curves up — shi.'], ['ツ', 'ン', 'ソ']],
  ス: [['A sumo wrestler squatting with legs apart.', 'ヌ (nu) without the extra dash.'], ['ヌ', 'ヲ']],
  セ: [['Hiragana せ without its right leg.', 'A hand holding a sign: “sell!”'], ['ヒ', 'サ']],
  ソ: [['A needle and thread: you “sew” (so).', 'Both strokes start at the top and go DOWN. ン’s stroke sweeps UP.'], ['ン', 'リ']],
  タ: [['ク with a line through the middle: a taco with filling.', 'Like the kanji 夕 (evening): ta-ta, see you this evening.'], ['ク', 'ヌ', 'ワ']],
  チ: [['A cheerleader with arms out and a ribbon on her head.', 'Like the kanji 千 (thousand): a thousand chips.'], ['テ', 'キ']],
  ツ: [['Two drops on top and a wave pouring DOWN: tsunami.', 'Dots stack along the top and the stroke sweeps down — シ’s goes up.'], ['シ', 'ソ']],
  テ: [['A telephone pole: two bars and a leg.', 'Hiragana て with an extra bar on top.'], ['チ', 'ラ']],
  ト: [['A totem pole with one branch.', 'The top of hiragana と on a straight post.'], ['イ']],
  ナ: [['A nail hammered into a wall at a slant.', 'The left half of hiragana な.'], ['メ']],
  ニ: [['Two lines — just like the kanji 二, “two” (ni).', 'Hiragana に without the stick.'], ['コ']],
  ヌ: [['ス with a dash: noodles with a dash of chili.', 'Two chopsticks crossing to pick up a noodle.'], ['ス', 'メ', 'フ']],
  ネ: [['A necktie hanging from a little hook.', 'A person in a hat bowing: never forget to bow.'], ['ホ']],
  ノ: [['One slash: a big “NO!”', 'The left half of hiragana の.'], ['メ', 'ソ']],
  ハ: [['Two lines spreading apart like laughing lips: “HA HA”.', 'Like the kanji 八 (eight, hachi) — ha-chi.'], ['ヘ']],
  ヒ: [['A heel kick: a leg with the heel sticking out.', 'Like the left part of hiragana ひ, squared off.'], ['セ']],
  フ: [['Just the hook of Mount Fuji’s peak.', 'A boomerang flying: “fooosh!”'], ['ウ', 'ワ', 'ヌ', 'ラ']],
  ヘ: [['A little hill: “Hey!” — same as hiragana へ.', 'Katakana and hiragana he are near twins; this one is a bit straighter.'], ['ハ']],
  ホ: [['A Christmas tree with two hanging ornaments: “Ho ho ho!”', 'A holy cross with two little legs.'], ['オ', 'ネ']],
  マ: [['A martini glass tipped on its side.', 'Like ア but the second stroke turns back in: ma, not a.'], ['ア', 'ム']],
  ミ: [['Three slanted lines — “mi” as in mittsu, three.', 'Three teardrops: me, me, me, crying.'], ['シ']],
  ム: [['A cow’s nose: “moo!”', 'Hiragana む that lost its curls and went pointy.'], ['ス', 'マ']],
  メ: [['An X that marks the spot: “mark ME”.', 'ノ with a slash crossing it.'], ['ナ', 'ノ', 'ヌ']],
  モ: [['Hiragana も straightened out: still “more” lines.', 'Two shelves on a hook: more shelves please.'], ['キ']],
  ヤ: [['A yak’s horn with a leg.', 'Hiragana や without the dash.'], ['セ']],
  ユ: [['A “U” shape turned sideways: U → yu (“you”).', 'Like コ but the bottom line sticks out.'], ['コ', 'エ']],
  ヨ: [['A backwards E: “Yo, that’s backwards!”', 'The side of a three-drawer cabinet: yo, open it.'], ['コ', 'ヲ']],
  ラ: [['A rake with a hooked handle.', 'フ wearing a flat cap.'], ['フ', 'ウ', 'テ']],
  リ: [['Hiragana り, just stiffer.', 'Two reeds, the right one taller.'], ['ソ']],
  ル: [['Two legs of a rooster, one kicking out.', 'Someone running: one leg straight, one kicking back.'], ['レ']],
  レ: [['A checkmark ✓: remember it.', 'The right leg of ル on its own.'], ['ル']],
  ロ: [['A room with four walls: a square.', 'A wide-open mouth saying “ro!”'], ['コ']],
  ワ: [['ウ without its chimney: water with no roof.', 'Like ク but with a flat top: a wave about to break.'], ['ウ', 'ク', 'フ']],
  ヲ: [['フ with an extra bar: “whoa, so many lines”.', 'Rare: mostly in names and old texts, and said “o”.'], ['ヨ', 'フ']],
  ン: [['A dot on the LEFT and a stroke sweeping UP.', 'Like ソ flipped around: ソ’s strokes come down, ン’s goes up.'], ['ソ', 'シ']],
};

// One sound hook per voiced row, shared by hiragana and katakana.
const VOICED_HOOKS: Record<string, string> = {
  ga: 'The two marks are drops of sweat: “Gah!”',
  gi: 'A key with two sparkles: a geeky key.',
  gu: 'Goo dripping in two drops.',
  ge: '“Get it!” — two quick taps.',
  go: 'Two sparks from a starting gun: Go!',
  za: 'Zap! The two marks are electric sparks.',
  ji: 'Two headlights on a jeep.',
  zu: 'Zoom: two speed lines.',
  ze: 'Two drops of lemon zest.',
  zo: 'Two zombie eyes in the dark.',
  da: 'Two dash marks: running fast.',
  de: 'Two pens on a desk.',
  do: 'Knock knock: two knocks on the door.',
  ba: 'Two baby bottles.',
  bi: 'Two bees buzzing around.',
  bu: '“Boo!” — two eyes popping out.',
  be: 'Two birds resting on the bend.',
  bo: 'Two little boats.',
  pa: 'The circle is a bubble: pa!',
  pi: 'A little round pea.',
  pu: 'A puff of smoke: poof.',
  pe: 'A pebble on the hilltop.',
  po: 'A polka dot.',
};

// ぢ/づ sound the same as じ/ず, so they get usage notes instead of a sound hook.
const RARE_HOOKS: Record<string, string> = {
  ぢ: 'Rare: mostly appears when ち gets voiced, as in はなぢ (hanaji, nosebleed).',
  づ: 'Rare: mostly appears when つ gets voiced, as in つづく (tsuzuku, to continue).',
  ヂ: 'Very rare in katakana; ジ is used almost always.',
  ヅ: 'Very rare in katakana; ズ is used almost always.',
};

const TENTEN = '゛ (tenten) makes the sound voiced, like adding a buzz in your throat';
const MARU = '゜ (maru) turns the h into a popping p';

/** Voiced row → [plain row, explanation, row whose kana look nearly identical]. */
const VOICING: Record<string, [plain: string, how: string, twin?: string]> = {
  ga: ['ka', TENTEN],
  za: ['sa', TENTEN],
  da: ['ta', TENTEN],
  ba: ['ha', TENTEN, 'pa'],
  pa: ['ha', MARU, 'ba'],
};

/** Same-sounding pairs: ぢ/じ and づ/ず. */
const SOUND_TWINS: Record<string, string> = { ぢ: 'じ', づ: 'ず', ヂ: 'ジ', ヅ: 'ズ' };

/** Looks up the kana in the same script at the same position of another row. */
function sibling(kana: Kana, rowId: string): [romaji: string, char: string] {
  const row = GROUPS.find((g) => g.id === kana.group)!;
  const index = row.rows.findIndex(([, h, k]) => h === kana.kana || k === kana.kana);
  const [romaji, h, k] = GROUPS.find((g) => g.id === rowId)!.rows[index]!;
  return [romaji, kana.script === 'hiragana' ? h : k];
}

export function mnemonicFor(kana: Kana): Mnemonic {
  const basic = BASIC[kana.kana];
  if (basic) return { tips: basic[0], confuse: basic[1] ?? [] };

  const voicing = VOICING[kana.group];
  if (!voicing) return { tips: [], confuse: [] };
  const [plainRow, how, twinRow] = voicing;
  const [plainRomaji, plain] = sibling(kana, plainRow);
  const rule = `It’s ${plain} (${plainRomaji}) plus a mark: ${how}.`;
  const hook = RARE_HOOKS[kana.kana] ?? VOICED_HOOKS[kana.romaji] ?? '';
  const confuse = [
    ...(twinRow ? [sibling(kana, twinRow)[1]] : []),
    ...(SOUND_TWINS[kana.kana] ? [SOUND_TWINS[kana.kana]!] : []),
  ];
  return { tips: [rule, hook].filter(Boolean), confuse };
}
