import type { Ingredient, Step } from './types';
import type { RecipeDraft } from './recipes';

/**
 * Tolkar ett recept i markdown till ett utkast. Formatet är det från den gamla bloggen:
 * frontmatter med title/excerpt/tags, en "## Ingredienser"-sektion med tabeller
 * (ev. grupperade under "####"-rubriker) och en "## Steg"-sektion med numrerad lista.
 * Text efter stegen, t.ex. "_Recept från Pia_" eller en länk, blir beskrivning respektive källa.
 */
export function parseMarkdownRecipe(markdown: string): RecipeDraft {
  const { meta, body } = splitFrontmatter(markdown.replace(/\r\n?/g, '\n'));
  const sections = splitSections(body);

  const ingredientLines = findSection(sections, /^(ingredienser|ingredients)$/i);
  const stepLines = findSection(sections, /^(steg|gör så här|instruktioner|instructions|method)$/i);
  if (!ingredientLines && !stepLines) throw new Error('not-a-recipe');

  const title = cleanInline(meta.title ?? sections.find((s) => s.level === 1)?.heading ?? '');
  if (!title) throw new Error('missing-title');

  const { steps, extra } = parseStepSection(stepLines ?? []);
  const url = extra.find((line) => /^https?:\/\/\S+$/.test(line));
  const credits = extra.filter((line) => line !== url);

  const intro = paragraphText(sections[0].heading === undefined ? sections[0].lines : []);
  const description = [intro || cleanInline(meta.excerpt ?? ''), ...credits].filter(Boolean).join('\n\n');
  // "räknat för 4 personer", "ca 8-10 personer" → första talet
  const servings = description.match(/(\d+)(?:\s*[-–]\s*\d+)?\s+(?:personer|portioner)/i)?.[1];

  return {
    title,
    description: description || undefined,
    servings: servings ? Number(servings) : undefined,
    ingredients: parseIngredientSection(ingredientLines ?? []),
    steps,
    tags: (meta.tags ?? '')
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag && tag !== 'recept'),
    source: url ? { kind: 'url', url } : { kind: 'manual' },
  };
}

/** Läser enkla `nyckel: värde`-rader på toppnivå. Indenterade (nästlade) rader ignoreras. */
function splitFrontmatter(markdown: string): { meta: Record<string, string>; body: string } {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { meta: {}, body: markdown };
  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) meta[kv[1]] = unquote(kv[2].trim());
  }
  return { meta, body: markdown.slice(match[0].length) };
}

function unquote(value: string): string {
  if (/^'.*'$/.test(value)) return value.slice(1, -1).replace(/''/g, "'");
  if (/^".*"$/.test(value)) return value.slice(1, -1).replace(/\\"/g, '"');
  return value;
}

interface Section {
  level?: number;
  heading?: string;
  lines: string[];
}

/** Delar upp i sektioner per rubrik på nivå 1–2. Lägre rubriker ("####") ligger kvar som rader. */
function splitSections(body: string): Section[] {
  const sections: Section[] = [{ lines: [] }];
  let inCode = false;
  for (const line of body.split('\n')) {
    if (line.trim().startsWith('```')) inCode = !inCode;
    const heading = !inCode && line.match(/^(#{1,2})\s+(.+?)\s*#*$/);
    if (heading) sections.push({ level: heading[1].length, heading: heading[2].trim(), lines: [] });
    else sections.at(-1)!.lines.push(line);
  }
  return sections;
}

function findSection(sections: Section[], name: RegExp): string[] | undefined {
  return sections.find((s) => s.heading && name.test(s.heading))?.lines;
}

const AMOUNT = /^[\d½¼¾⅓⅔]/;

function parseIngredientSection(lines: string[]): Ingredient[] {
  const result: Ingredient[] = [];
  let group: string | undefined;
  for (const raw of lines) {
    const line = raw.trim();
    const heading = line.match(/^#{3,6}\s+(.+)$/);
    if (heading) {
      group = cleanInline(heading[1]);
      continue;
    }
    if (!line.startsWith('|') || /^\|[\s|:-]*$/.test(line)) continue;

    const cells = line
      .replace(/^\||\|$/g, '')
      .split('|')
      .map(cleanInline);
    const filled = cells.filter(Boolean);
    if (filled.length === 0) continue;

    // Normalt "mängd | namn", men en del recept har kolumnerna åt andra hållet.
    let [quantity, name] = filled.length === 1 ? ['', filled[0]] : [cells[0], cells[1]];
    if (filled.length > 1 && !AMOUNT.test(quantity) && AMOUNT.test(name)) [quantity, name] = [name, quantity];

    const ingredient: Ingredient = { name, ...splitQuantity(quantity) };
    if (group) ingredient.group = group;
    result.push(ingredient);
  }
  return result;
}

/** "2 burkar (ca 200 g)" → mängd "2", enhet "burkar (ca 200 g)". "1st" → "1" + "st". */
function splitQuantity(quantity: string): Pick<Ingredient, 'amount' | 'unit'> {
  if (!quantity) return {};
  const match = quantity.match(/^([\d.,/½¼¾⅓⅔-]+)\s*(.*)$/);
  if (!match) return { unit: quantity };
  return match[2] ? { amount: match[1], unit: match[2] } : { amount: match[1] };
}

/**
 * Numrerade listpunkter blir steg. Indenterade rader direkt efter hör till samma steg.
 * Övriga textrader efter listan returneras som `extra`.
 */
function parseStepSection(lines: string[]): { steps: Step[]; extra: string[] } {
  const steps: Step[] = [];
  const extra: string[] = [];
  let current: string[] | undefined;
  let inCode = false;

  const flush = () => {
    if (current) steps.push({ text: current.join(' ') });
    current = undefined;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('```')) {
      inCode = !inCode;
      continue;
    }
    if (inCode || !line || /^<[^>]+>$/.test(line)) continue;

    const item = line.match(/^\d+[.)]\s+(.*)$/);
    if (item) {
      flush();
      current = [cleanInline(item[1])];
    } else if (current && /^\s/.test(raw)) {
      current.push(cleanInline(line));
    } else {
      flush();
      extra.push(cleanInline(line));
    }
  }
  flush();
  return { steps, extra: extra.filter(Boolean) };
}

function paragraphText(lines: string[]): string {
  return lines
    .join('\n')
    .split(/\n\s*\n/)
    .map((p) => cleanInline(p.replace(/\s*\n\s*/g, ' ')))
    .filter((p) => p && !/^<[^>]+>$/.test(p))
    .join('\n\n');
}

const ENTITIES: Record<string, string> = { shy: '', nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

/** Tar bort markdown-formatering och html-entiteter så att texten kan visas som den är. */
function cleanInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*|__(.+?)__/g, '$1$2')
    .replace(/(^|\W)[*_](.+?)[*_](?=\W|$)/g, '$1$2')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\\([*_|\\])/g, '$1')
    .replace(/&(#\d+|[a-z]+);/gi, (m, name: string) =>
      name.startsWith('#') ? String.fromCodePoint(Number(name.slice(1))) : (ENTITIES[name.toLowerCase()] ?? m),
    )
    .trim();
}
