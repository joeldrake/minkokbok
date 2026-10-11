import type { Palette } from '../theme/palette';

export interface Ingredient {
  amount?: string;
  unit?: string;
  name: string;
  note?: string;
  /** Rubrik att gruppera under, t.ex. "Sås" */
  group?: string;
}

export interface Step {
  text: string;
}

/**
 * Omslag ritat av emojis på en tygfärg. Utspridningen räknas fram ur seed,
 * så omslaget ser likadant ut överallt och "Blanda" bara byter seed.
 */
export interface EmojiCover {
  kind: 'emoji';
  emojis: string[];
  palette: Palette;
  seed: number;
}

/**
 * Egen bild, krympt i webbläsaren innan den sparas. Dexie Cloud laddar upp
 * Blob-fält till sin bloblagring vid synk, så synken skickar bara en referens.
 */
export interface PhotoCover {
  kind: 'photo';
  image: Blob;
}

export type Cover = EmojiCover | PhotoCover;

export type RecipeSourceKind = 'manual' | 'url' | 'image' | 'instagram';

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  ingredients: Ingredient[];
  steps: Step[];
  tags: string[];
  source?: { kind: RecipeSourceKind; url?: string };
  cover?: Cover;
  /**
   * Del av den publika adressen, /[användarnamn]/[slug]. Räknas fram ur titeln och är
   * unik bland ägarens recept.
   */
  slug?: string;
  /** Tidigare slugs, så att gamla delade länkar fortsätter fungera när titeln ändras. */
  slugHistory?: string[];
  /** Förhandsbild (1200×630) för länkar som delas i sociala medier. Finns bara på publika recept. */
  ogImage?: Blob;
  createdAt: number;
  updatedAt: number;
}

/** Publik profil. Ligger i den publika realmen och visas på /[username]. */
export interface Profile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
}
