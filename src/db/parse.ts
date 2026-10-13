import type { Ingredient, Step } from './types';

/** Enheter som känns igen efter mängden. Annat ord räknas som början på namnet. */
const UNITS = new Set([
  'krm', 'tsk', 'msk', 'ml', 'cl', 'dl', 'l', 'liter', 'mg', 'g', 'gram', 'hg', 'kg',
  'st', 'stk', 'förp', 'förpackning', 'förpackningar', 'paket', 'pkt', 'burk', 'burkar',
  'påse', 'påsar', 'ask', 'askar', 'flaska', 'flaskor', 'tub', 'tuber', 'kruka', 'krukor',
  'knippe', 'knippen', 'klyfta', 'klyftor', 'skiva', 'skivor', 'nypa', 'nypor', 'kopp', 'koppar',
  'portion', 'portioner', 'bit', 'bitar', 'cm', 'mm',
]);

const AMOUNT = /^(\d+\s+[½¼¾⅓⅔]|[\d.,/½¼¾⅓⅔-]+)\s+(.+)$/;

/** Första kommatecknet som inte är ett decimalkomma, t.ex. inte det i "2,5 dl". */
const NOTE_SEPARATOR = /(?<!\d),|,(?!\d)/;

/**
 * Tolkar en ingrediensrad som "2 dl mjölk", "2,5 dl grädde" eller
 * "2 vitlöksklyftor, pressade". Rader som slutar med kolon, t.ex. "Sås:",
 * blir gruppnamn för följande rader.
 */
export function parseIngredients(text: string): Ingredient[] {
  const result: Ingredient[] = [];
  let group: string | undefined;

  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.endsWith(':')) {
      group = line.slice(0, -1).trim();
      continue;
    }
    const separator = line.search(NOTE_SEPARATOR);
    const main = (separator === -1 ? line : line.slice(0, separator)).trim();
    const note = separator === -1 ? undefined : line.slice(separator + 1).trim() || undefined;
    const ingredient = parseMain(main);
    if (note) ingredient.note = note;
    if (group) ingredient.group = group;
    result.push(ingredient);
  }
  return result;
}

function parseMain(main: string): Ingredient {
  const match = main.match(AMOUNT);
  if (!match) return { name: main };
  const amount = match[1].replace(/\s+/g, ' ');
  const [unit, ...rest] = match[2].split(/\s+/);
  if (rest.length && UNITS.has(unit.toLowerCase().replace(/\.$/, ''))) {
    return { amount, unit, name: rest.join(' ') };
  }
  return { amount, name: match[2] };
}

export function formatIngredients(ingredients: Ingredient[]): string {
  const lines: string[] = [];
  let group: string | undefined;
  for (const i of ingredients) {
    if (i.group !== group) {
      group = i.group;
      if (group) lines.push(`${group}:`);
    }
    const main = [i.amount, i.unit, i.name].filter(Boolean).join(' ');
    lines.push(i.note ? `${main}, ${i.note}` : main);
  }
  return lines.join('\n');
}

/** Ett steg per stycke (tom rad mellan) eller per rad. Inledande "1." tas bort. */
export function parseSteps(text: string): Step[] {
  const blocks = text.includes('\n\n') ? text.split(/\n\s*\n/) : text.split('\n');
  return blocks
    .map((b) => b.trim().replace(/^\d+[.)]\s*/, ''))
    .filter(Boolean)
    .map((text) => ({ text }));
}

export function formatSteps(steps: Step[]): string {
  return steps.map((s) => s.text).join('\n\n');
}
