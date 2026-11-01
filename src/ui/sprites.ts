// Pixel sprites as string grids. Each character maps to a palette color;
// "." is transparent. Kept dependency-free so scripts/make-icons.ts can reuse it.

export interface Sprite {
  grid: string[];
  palette: Record<string, string>;
}

export const NIGIRI: Sprite = {
  palette: {
    k: '#2a1a2e', // outline
    o: '#ff8a5c', // salmon
    O: '#e0603a', // salmon underside
    w: '#ffc4a8', // salmon fat stripe
    h: '#fff1e8', // highlight
    r: '#f4efe4', // rice
    s: '#d9d0c0', // rice shadow
    e: '#1a1020', // eyes / mouth
    p: '#ff9cbc', // blush
  },
  grid: [
    '........................',
    '........................',
    '........................',
    '......kkkkkkkkkkkk......',
    '....kkohhooowoooowkk....',
    '...kohooooowoooowoook...',
    '..koowoooowoooowoooowk..',
    '..kowoooowoooowoooowok..',
    '.kowoooowoooowoooowoook.',
    '.kOOOOOOOOOOOOOOOOOOOOk.',
    '.kkrrrrrrrrrrrrrrrrrrkk.',
    '..krrrsrrrrrrrrrrsrrrk..',
    '..krrrrrrrrrrrrrrrrrrk..',
    '..krrrrehrrrrrrehrrrrk..',
    '..krrrreerrrrrreerrrrk..',
    '..krrpprrrreerrrrpprrk..',
    '..krsrrrrrrrrrrrrrrsrk..',
    '..krrrrrrrrrrrrrrrrrrk..',
    '..kssssssssssssssssssk..',
    '...kkkkkkkkkkkkkkkkkk...',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
};

export const FLAME: Sprite = {
  palette: { r: '#e63946', o: '#ff8a3d', y: '#ffd166' },
  grid: [
    '...r....',
    '...rr...',
    '..rror..',
    '.rrooor.',
    '.rooyoor',
    '.royyyor',
    '..ryyyr.',
    '...rrr..',
  ],
};

// ---------- Shop tools (16×16) ----------

const OUTLINE = '#2a1a2e';

export const SHAMOJI: Sprite = {
  palette: { k: OUTLINE, b: '#e8c88a', B: '#c49a5a', h: '#fff1e8', r: '#f4efe4' },
  grid: [
    '................',
    '.....kkkkkk.....',
    '....kbbbbbbk....',
    '...kbhbbbbbBk...',
    '...kbhbbrbbBk...',
    '...kbbbbbbbBk...',
    '...kbbbbbbbBk...',
    '....kbbbbbBk....',
    '.....kbbbBk.....',
    '......kbBk......',
    '......kbBk......',
    '......kbBk......',
    '......kbBk......',
    '......kbBk......',
    '......kkkk......',
    '................',
  ],
};

export const YANAGIBA: Sprite = {
  palette: { k: OUTLINE, s: '#d5dcea', S: '#8f9bb3', g: '#e8c88a', w: '#b5763a', W: '#7a4a22' },
  grid: [
    '..............kk',
    '.............ksk',
    '............kssk',
    '...........kssk.',
    '..........kssk..',
    '.........kssk...',
    '........kssk....',
    '.......kSsk.....',
    '......kSSk......',
    '.....kggk.......',
    '....kwwk........',
    '...kwWk.........',
    '..kwWk..........',
    '.kwWk...........',
    '.kkk............',
    '................',
  ],
};

export const MAKISU: Sprite = {
  palette: { k: OUTLINE, b: '#e8d49a', B: '#c4a860', t: '#5a3a2a' },
  grid: [
    '................',
    '................',
    '.kkkkkkkkkkkkkk.',
    '.kbbbtbbbbtbbbk.',
    '.kBBBtBBBBtBBBk.',
    '.kbbbtbbbbtbbbk.',
    '.kBBBtBBBBtBBBk.',
    '.kbbbtbbbbtbbbk.',
    '.kBBBtBBBBtBBBk.',
    '.kbbbtbbbbtbbbk.',
    '.kBBBtBBBBtBBBk.',
    '.kbbbtbbbbtbbbk.',
    '.kBBBtBBBBtBBBk.',
    '.kkkkkkkkkkkkkk.',
    '................',
    '................',
  ],
};

export const UCHIWA: Sprite = {
  palette: { k: OUTLINE, p: '#f4efe4', r: '#e63946', w: '#b5763a' },
  grid: [
    '................',
    '.....kkkkkk.....',
    '...kkppppppkk...',
    '..kppppppppppk..',
    '..kpppprrppppk..',
    '.kppprrrrrrpppk.',
    '.kpprrrrrrrrppk.',
    '.kppprrrrrrpppk.',
    '..kpppprrppppk..',
    '..kppppppppppk..',
    '...kkppppppkk...',
    '.....kkwwkk.....',
    '......kwwk......',
    '......kwwk......',
    '......kwwk......',
    '......kkkk......',
  ],
};

export const HANGIRI: Sprite = {
  palette: { k: OUTLINE, r: '#f4efe4', s: '#d9d0c0', w: '#c98a4b', W: '#8a5a2b', c: '#d9a441' },
  grid: [
    '................',
    '................',
    '................',
    '................',
    '.....kkkkkk.....',
    '...kkrrrrrrkk...',
    '.kkrrrrsrrrrrkk.',
    'kwwwwwwwwwwwwwwk',
    'kWWWWWWWWWWWWWWk',
    '.kwwwwwwwwwwwwk.',
    '.kcccccccccccck.',
    '.kwwwwwwwwwwwwk.',
    '..kwwwwwwwwwwk..',
    '..kcccccccccck..',
    '...kkkkkkkkkk...',
    '................',
  ],
};

export const DEBA: Sprite = {
  palette: { k: OUTLINE, s: '#d5dcea', S: '#8f9bb3', h: '#ffffff', w: '#b5763a', W: '#7a4a22', g: '#e8c88a' },
  grid: [
    '................',
    '................',
    '..kkkkkkkk......',
    '.khsssssssk.....',
    '.ksssssssssk....',
    '.kssssssssssk...',
    '.kSSSSSSSSSSSk..',
    '..kkkkkkkkkkgkk.',
    '............kwwk',
    '............kwWk',
    '............kwWk',
    '............kwWk',
    '............kwWk',
    '............kkkk',
    '................',
    '................',
  ],
};

export const NOREN: Sprite = {
  palette: { k: OUTLINE, b: '#2b4a8a', B: '#1f3566', w: '#f4efe4', p: '#8a5a2b' },
  grid: [
    '................',
    'kkkkkkkkkkkkkkkk',
    'kppppppppppppppk',
    'kkkkkkkkkkkkkkkk',
    '.kbbbbk..kbbbbk.',
    '.kbbbbk..kbbbbk.',
    '.kbwwbk..kbwwbk.',
    '.kbwwbk..kbwwbk.',
    '.kbbbbk..kbbbbk.',
    '.kbbbbk..kbbbbk.',
    '.kBbbbk..kbbbBk.',
    '.kBBbbk..kbbBBk.',
    '.kBBBbk..kbBBBk.',
    '.kkkkkk..kkkkkk.',
    '................',
    '................',
  ],
};

export const CHOCHIN: Sprite = {
  palette: { k: OUTLINE, r: '#e63946', R: '#a8222f', y: '#ffd166', d: '#3a2a2a' },
  grid: [
    '.......kk.......',
    '......kddk......',
    '....kkkkkkkk....',
    '...krrrrrrrrk...',
    '..krrRrrrrRrrk..',
    '..kRRRRRRRRRRk..',
    '.krrrryyyyrrrrk.',
    '.krrrryrryrrrrk.',
    '.kRRRRyyyyRRRRk.',
    '.krrrryrryrrrrk.',
    '..kRRRRRRRRRRk..',
    '..krrRrrrrRrrk..',
    '...krrrrrrrrk...',
    '....kkkkkkkk....',
    '......kddk......',
    '.......kk.......',
  ],
};

export const KAITEN: Sprite = {
  palette: { k: OUTLINE, g: '#5f5878', G: '#3d3560', p: '#f4efe4', o: '#ff8a5c', r: '#f4efe4', b: '#7cc6ff' },
  grid: [
    '................',
    '................',
    '................',
    '...koook.kbbk...',
    '..krrrrk.krrk...',
    '.kppppppkppppk..',
    'kkkkkkkkkkkkkkkk',
    'kggggggggggggggk',
    'kGgGgGgGgGgGgGgk',
    'kggggggggggggggk',
    'kkkkkkkkkkkkkkkk',
    '.kGk........kGk.',
    '.kGk........kGk.',
    '.kkk........kkk.',
    '................',
    '................',
  ],
};

export const ITAMAE: Sprite = {
  palette: { k: OUTLINE, w: '#f4efe4', W: '#d9d0c0', s: '#f2c39b', S: '#d99f78', r: '#e63946', e: '#1a1020' },
  grid: [
    '....kkkkkkkk....',
    '...kwwwwwwwwk...',
    '..kwwwwwwwwwwk..',
    '..kwwwwwwwwwWk..',
    '..krrrrrrrrrrkk.',
    '..kssssssssssrk.',
    '..ksseessseesk..',
    '..kssssssssssk..',
    '..ksssssSsssSk..',
    '..kssskkkksssk..',
    '...kssssssssk...',
    '....kkkkkkkk....',
    '..kkwwwwwwwwkk..',
    '.kwwwwwrrwwwwwk.',
    '.kwwwwwrrwwwwWk.',
    '.kkkkkkkkkkkkkk.',
  ],
};

/** Renders a sprite as an SVG string, merging horizontal runs of one color into a single rect. */
export function spriteSvg(sprite: Sprite, className = ''): string {
  const height = sprite.grid.length;
  const width = sprite.grid[0]?.length ?? 0;
  const rects: string[] = [];
  sprite.grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x]!;
      let run = 1;
      while (row[x + run] === ch) run++;
      const color = sprite.palette[ch];
      if (color) rects.push(`<rect x="${x}" y="${y}" width="${run}" height="1" fill="${color}"/>`);
      x += run;
    }
  });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
    `shape-rendering="crispEdges" class="${className}" aria-hidden="true">${rects.join('')}</svg>`
  );
}

// ---------- Interface icons ----------

/** The speaker on "hear it" buttons. */
export const SPEAKER: Sprite = {
  palette: { s: '#f4efe4', w: '#ffd166' },
  grid: [
    '............',
    '.....s......',
    '....ss...w..',
    '...sss....w.',
    'ssssss..w..w',
    'ssssss...w.w',
    'ssssss...w.w',
    'ssssss..w..w',
    '...sss....w.',
    '....ss...w..',
    '.....s......',
    '............',
  ],
};
