import type { Ingredient } from '../db/types';

/** Max antal emojis på ett omslag. */
export const MAX_COVER_EMOJIS = 8;

/**
 * Ordlista från ingrediensord till emoji. Orden jämförs mot varje ord i
 * ingrediensnamnet, längsta först, så att "vitlök" vinner över "lök" och
 * "olivolja" (null = ingen emoji) över "oliv".
 *
 * Ord på 3 bokstäver eller kortare matchar bara i början eller slutet av ett ord
 * ("rödlök", "äggula") så att t.ex. "ris" inte hittas mitt i andra ord.
 * Längre ord matchar var som helst i ordet ("kycklingfilé", "hallonsylt").
 */
const WORDS: Record<string, string | null> = {
  // Basvaror som inte säger något om rätten
  olivolja: null,
  rapsolja: null,
  buljong: null,
  fond: null,
  vinäger: null,

  // Grönsaker
  tomat: '🍅',
  potatis: '🥔',
  morot: '🥕',
  moröt: '🥕',
  gurka: '🥒',
  paprika: '🫑',
  chili: '🌶️',
  jalapeño: '🌶️',
  vitlök: '🧄',
  lök: '🧅',
  purjo: '🧅',
  schalottenlök: '🧅',
  champinjon: '🍄',
  svamp: '🍄',
  kantarell: '🍄',
  karljohan: '🍄',
  majs: '🌽',
  broccoli: '🥦',
  blomkål: '🥦',
  sallad: '🥬',
  spenat: '🥬',
  kål: '🥬',
  grönkål: '🥬',
  aubergine: '🍆',
  avokado: '🥑',
  ärt: '🫛',
  sockerärt: '🫛',
  bön: '🫘',
  kikärt: '🫘',
  linser: '🫘',
  ingefära: '🫚',
  oliv: '🫒',
  pumpa: '🎃',
  sötpotatis: '🍠',
  rödbet: '🟣',

  // Örter
  basilika: '🌿',
  persilja: '🌿',
  dill: '🌿',
  koriander: '🌿',
  timjan: '🌿',
  rosmarin: '🌿',
  mynta: '🌿',
  gräslök: '🌿',

  // Frukt och bär
  citron: '🍋',
  lime: '🍋',
  apelsin: '🍊',
  mandarin: '🍊',
  clementin: '🍊',
  banan: '🍌',
  äpple: '🍎',
  äppel: '🍎',
  päron: '🍐',
  persika: '🍑',
  körsbär: '🍒',
  jordgubb: '🍓',
  hallon: '🍓',
  bär: '🫐',
  vindruv: '🍇',
  druvor: '🍇',
  ananas: '🍍',
  mango: '🥭',
  kokos: '🥥',
  melon: '🍈',
  vattenmelon: '🍉',
  kiwi: '🥝',

  // Kött, fågel och chark
  kyckling: '🍗',
  kalkon: '🍗',
  kött: '🥩',
  biff: '🥩',
  entrecôte: '🥩',
  oxfilé: '🥩',
  färs: '🥩',
  fläsk: '🥓',
  bacon: '🥓',
  pancetta: '🥓',
  skinka: '🍖',
  lamm: '🍖',
  korv: '🌭',
  chorizo: '🌭',

  // Fisk och skaldjur
  fisk: '🐟',
  lax: '🐟',
  torsk: '🐟',
  sej: '🐟',
  sill: '🐟',
  tonfisk: '🐟',
  räk: '🦐',
  scampi: '🦐',
  mussl: '🦪',
  ostron: '🦪',
  bläckfisk: '🦑',
  hummer: '🦞',
  kräft: '🦞',
  krabba: '🦀',

  // Mejeri och ägg
  ägg: '🥚',
  ost: '🧀',
  parmesan: '🧀',
  mozzarella: '🧀',
  halloumi: '🧀',
  cheddar: '🧀',
  mjölk: '🥛',
  grädde: '🥛',
  smör: '🧈',

  // Spannmål, bröd och pasta
  pasta: '🍝',
  spaghetti: '🍝',
  makaron: '🍝',
  penne: '🍝',
  tagliatelle: '🍝',
  lasagne: '🍝',
  nudlar: '🍜',
  ris: '🍚',
  risotto: '🍚',
  bröd: '🍞',
  baguette: '🥖',
  tortilla: '🌮',
  taco: '🌮',
  pizza: '🍕',
  mjöl: '🌾',
  havre: '🌾',

  // Nötter och sött
  nöt: '🥜',
  nötter: '🥜',
  mandel: '🌰',
  kastanj: '🌰',
  choklad: '🍫',
  kakao: '🍫',
  honung: '🍯',
  sirap: '🍯',
  vanilj: '🍦',
  glass: '🍨',

  // Dryck
  vin: '🍷',
  rödvin: '🍷',
  öl: '🍺',
  kaffe: '☕',
  espresso: '☕',
};

const SORTED_WORDS = Object.entries(WORDS).sort(([a], [b]) => b.length - a.length);

function matchToken(token: string): string | null | undefined {
  for (const [word, emoji] of SORTED_WORDS) {
    const hit =
      word.length > 3 ? token.includes(word) : token === word || token.startsWith(word) || token.endsWith(word);
    if (hit) return emoji;
  }
  return undefined;
}

/** Emojis som finns i en text, t.ex. "Pasta med lax" ger 🍝 och 🐟. */
export function emojisInText(text: string): string[] {
  const result: string[] = [];
  for (const token of text.toLowerCase().split(/[^\p{L}]+/u)) {
    if (!token) continue;
    const emoji = matchToken(token);
    if (emoji) result.push(emoji);
  }
  return result;
}

/**
 * Föreslår emojis för ett recept. Titeln kommer först eftersom den oftast säger
 * mest om rätten, sedan ingredienserna i den ordning de står.
 */
export function suggestEmojis(recipe: { title: string; ingredients: Ingredient[] }): string[] {
  const found = [
    ...emojisInText(recipe.title),
    ...recipe.ingredients.flatMap((ingredient) => emojisInText(ingredient.name)),
  ];
  return [...new Set(found)];
}

const segmenter = new Intl.Segmenter('sv', { granularity: 'grapheme' });

/** Plockar ut emojis ur fritext. Bokstäver, mellanslag och annat ignoreras. */
export function parseEmojis(text: string): string[] {
  return [...segmenter.segment(text)]
    .map((s) => s.segment)
    .filter((s) => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(s))
    .slice(0, MAX_COVER_EMOJIS);
}
