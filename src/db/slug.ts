/** Längsta slug. Räcker för de flesta titlar utan att adressen blir orimligt lång. */
const MAX_LENGTH = 60;

/**
 * Gör en titel till en del av en adress, t.ex. "Mormors äppelpaj" ger "mormors-appelpaj".
 * Å, ä och ö blir a, a och o, och allt som inte är a–z eller 0–9 blir bindestreck.
 */
export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, MAX_LENGTH)
    .replace(/^-+|-+$/g, '');
  return slug || 'recept';
}

/** Första lediga varianten av titelns slug: "kladdkaka", "kladdkaka-2", "kladdkaka-3" … */
export function uniqueSlug(title: string, taken: Set<string>): string {
  const base = slugify(title);
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
