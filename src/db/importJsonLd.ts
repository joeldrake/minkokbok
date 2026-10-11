import type { Step } from './types';
import type { RecipeDraft } from './recipes';
import { parseIngredients, parseSteps } from './parse';

/**
 * Receptdata enligt schema.org/Recipe, som receptsajter lägger i
 * `<script type="application/ld+json">` för Googles sökresultat. Bara fälten vi läser.
 * Typerna är lösa eftersom sajterna fyller i dem på väldigt olika sätt.
 */
type JsonLdRecipe = Record<string, unknown>;

export interface JsonLdImport {
  draft: RecipeDraft;
  /** Receptets bild. Hämtas separat, eftersom webbläsaren inte får läsa bilder från andra sajter. */
  imageUrl?: string;
}

/**
 * Tolkar JSON-LD-blocken från en receptsida till ett utkast. `pageUrl` blir receptets källa
 * och används för att göra relativa bildadresser absoluta.
 */
export function parseRecipeJsonLd(blocks: string[], pageUrl: string): JsonLdImport {
  const recipe = blocks.map(parseJson).map(findRecipe).find(Boolean);
  if (!recipe) throw new Error('no-recipe');

  const title = text(recipe.name);
  if (!title) throw new Error('missing-title');

  const authors = list(recipe.author).map(name).filter(Boolean);
  const description = [text(recipe.description), authors.length ? `Recept från ${authors.join(' och ')}` : '']
    .filter(Boolean)
    .join('\n\n');

  const prepMinutes = minutes(recipe.prepTime);
  let cookMinutes = minutes(recipe.cookTime);
  // Appen visar förberedelse + tillagning som total tid. Finns bara totalTime hamnar den i tillagning.
  if (!prepMinutes && !cookMinutes) cookMinutes = minutes(recipe.totalTime);

  const ingredientLines = list(recipe.recipeIngredient ?? recipe.ingredients).map(text).filter(Boolean);
  const image = list(recipe.image).map((i) => (typeof i === 'string' ? i : str((i as JsonLdRecipe)?.url))).find(Boolean);

  return {
    draft: {
      title,
      description: description || undefined,
      servings: servings(recipe.recipeYield),
      prepMinutes,
      cookMinutes,
      ingredients: parseIngredients(ingredientLines.join('\n')),
      steps: steps(recipe.recipeInstructions),
      tags: tags(recipe),
      source: { kind: 'url', url: pageUrl },
    },
    // En del sajter html-kodar adressen, t.ex. "&amp;" mellan parametrarna (MatHem).
    imageUrl: image ? absoluteUrl(decodeEntities(image.trim()), pageUrl) : undefined,
  };
}

/** Vissa sajter har råa radbrytningar i strängarna, vilket JSON inte tillåter. */
function parseJson(block: string): unknown {
  try {
    return JSON.parse(block);
  } catch {
    try {
      // oxlint-disable-next-line no-control-regex -- just kontrolltecknen ska bort
      return JSON.parse(block.replace(/[\u0000-\u001f]+/g, ' '));
    } catch {
      return undefined;
    }
  }
}

/** Receptet kan ligga överst, i en lista, i `@graph` eller i t.ex. `mainEntity`. */
function findRecipe(node: unknown, depth = 0): JsonLdRecipe | undefined {
  if (!node || typeof node !== 'object' || depth > 6) return undefined;
  if (Array.isArray(node)) return node.map((n) => findRecipe(n, depth + 1)).find(Boolean);
  const obj = node as JsonLdRecipe;
  if (list(obj['@type']).some((type) => /(^|[/:])Recipe$/.test(String(type)))) return obj;
  return Object.values(obj)
    .map((v) => findRecipe(v, depth + 1))
    .find(Boolean);
}

function list(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function name(value: unknown): string {
  return typeof value === 'string' ? text(value) : text((value as JsonLdRecipe | undefined)?.name);
}

/** Ger text utan html-taggar och entiteter, på en rad. */
function text(value: unknown): string {
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' ? cleanHtml(value).replace(/\s+/g, ' ').trim() : '';
}

// Svenska sajter skriver ofta å, ä och ö som namngivna entiteter.
const ENTITIES: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", shy: '',
  aring: 'å', auml: 'ä', ouml: 'ö', Aring: 'Å', Auml: 'Ä', Ouml: 'Ö', eacute: 'é', Eacute: 'É', uuml: 'ü',
  ndash: '–', mdash: '—', hellip: '…', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  deg: '°', frac12: '½', frac14: '¼', frac34: '¾', times: '×',
};

/** Tar bort taggar och avkodar entiteter. `<br>` och `</p>` blir radbrytningar. */
function cleanHtml(html: string): string {
  return decodeEntities(html.replace(/<br\s*\/?>|<\/(p|li|div)>/gi, '\n').replace(/<[^>]*>/g, ''));
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (m, entity: string) => {
    if (entity[0] !== '#') return ENTITIES[entity] ?? ENTITIES[entity.toLowerCase()] ?? m;
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return Number.isFinite(code) ? String.fromCodePoint(code) : m;
  });
}

/** ISO 8601-tid, t.ex. "PT1H15M" eller "P0DT45M", i hela minuter. Noll blir undefined. */
function minutes(value: unknown): number | undefined {
  const match = str(value)?.trim().match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?)?$/i);
  if (!match) return undefined;
  const [, d = 0, h = 0, m = 0, s = 0] = match;
  const total = Math.round(Number(d) * 1440 + Number(h) * 60 + Number(m) + Number(s) / 60);
  return total > 0 ? total : undefined;
}

/** "4", 4, "4 portioner", ["4", "4 portioner"] → 4. */
function servings(value: unknown): number | undefined {
  for (const v of list(value)) {
    const n = Number(String(v).match(/\d+/)?.[0]);
    if (n > 0) return n;
  }
  return undefined;
}

/**
 * Instruktionerna kan vara en text, en lista med texter, HowToStep eller HowToSection
 * med egna steg. Sektioner plattas ut, eftersom stegen i appen inte har grupper.
 */
function steps(value: unknown): Step[] {
  if (typeof value === 'string') return parseSteps(cleanHtml(value).replace(/[ \t]+/g, ' '));
  return list(value).flatMap((item): Step[] => {
    if (typeof item === 'string') return parseSteps(cleanHtml(item).replace(/[ \t]+/g, ' '));
    const obj = item as JsonLdRecipe | undefined;
    if (!obj || typeof obj !== 'object') return [];
    if (obj.itemListElement) return steps(obj.itemListElement);
    const stepText = text(obj.text) || text(obj.name);
    return stepText ? [{ text: stepText }] : [];
  });
}

/** Nyckelord, kategori och kök blir taggar. Nyckelord är ofta en kommaseparerad text. */
function tags(recipe: JsonLdRecipe): string[] {
  const all = [recipe.keywords, recipe.recipeCategory, recipe.recipeCuisine]
    .flatMap(list)
    .flatMap((v) => text(v).split(','))
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  return [...new Set(all)];
}

function absoluteUrl(url: string, base: string): string | undefined {
  try {
    const absolute = new URL(url, base);
    return /^https?:$/.test(absolute.protocol) ? absolute.href : undefined;
  } catch {
    return undefined;
  }
}
