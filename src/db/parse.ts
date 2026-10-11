import type { Ingredient, Step } from './types';

/**
 * Tolkar en ingrediensrad som "2 dl mjölk" eller "1 st gul lök, finhackad".
 * Rader som slutar med kolon, t.ex. "Sås:", blir gruppnamn för följande rader.
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
    const [main, ...noteParts] = line.split(',');
    const note = noteParts.join(',').trim() || undefined;
    const match = main.trim().match(/^([\d.,/½¼¾⅓⅔-]+)\s+(\S+)\s+(.+)$/);
    const ingredient: Ingredient = match
      ? { amount: match[1], unit: match[2], name: match[3] }
      : { name: main.trim() };
    if (note) ingredient.note = note;
    if (group) ingredient.group = group;
    result.push(ingredient);
  }
  return result;
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
