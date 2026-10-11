import type { EmojiCover } from '../db/types';

const COLUMNS = 6;
const ROWS = 3;

export interface PlacedEmoji {
  emoji: string;
  /** Mitten, som andel av omslagets bredd och höjd (0–1) */
  x: number;
  y: number;
  /** Storlek relativt grundstorleken */
  size: number;
  /** Vinkel i grader */
  turn: number;
}

/** Liten deterministisk slumpgenerator (mulberry32), så samma seed ger samma omslag. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Emojis utspridda i ett förskjutet rutnät med lite slumpad plats, storlek och vinkel.
 * Delas av omslaget i appen och förhandsbilden för delade länkar.
 */
export function layoutEmojis({ emojis, seed }: Pick<EmojiCover, 'emojis' | 'seed'>): PlacedEmoji[] {
  if (emojis.length === 0) return [];
  const rand = random(seed);
  const result: PlacedEmoji[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      // Varannan rad förskjuts ett halvt steg, som ett tegelmönster
      const x = (col + (row % 2) * 0.5 + 0.25 + rand() * 0.5) / COLUMNS;
      const y = (row + 0.25 + rand() * 0.5) / ROWS;
      let index = Math.floor(rand() * emojis.length);
      // Undvik samma emoji två gånger i rad
      if (emojis.length > 1 && result.at(-1)?.emoji === emojis[index]) index = (index + 1) % emojis.length;
      result.push({ emoji: emojis[index], x, y, size: 0.75 + rand() * 0.6, turn: Math.round(rand() * 50 - 25) });
    }
  }
  return result;
}
