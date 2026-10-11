/**
 * Receptdata enligt schema.org/Recipe för publika receptsidor. Google använder den för att
 * visa receptet som recept i sökresultaten, och andra receptappar kan importera det
 * (Min Kokboks egen import läser samma format, se src/db/importJsonLd.ts).
 */

export interface JsonLdSource {
  title: string;
  description?: string;
  servings?: number;
  prepMinutes?: number;
  cookMinutes?: number;
  ingredients?: { amount?: string; unit?: string; name: string; note?: string }[];
  steps?: { text: string }[];
  tags?: string[];
  createdAt?: number;
  updatedAt: number;
}

export interface JsonLdContext {
  url: string;
  imageUrl?: string;
  author: { name: string; url: string };
}

/**
 * Textfälten html-kodas: schema.org tillåter html i dem, så importerare tar bort det som ser ut
 * som taggar. Utan kodning skulle t.ex. "Blanda <allt>" bli "Blanda ".
 */
export function recipeJsonLd(recipe: JsonLdSource, context: JsonLdContext): Record<string, unknown> {
  const total = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: escapeHtml(recipe.title),
    description: recipe.description && escapeHtml(recipe.description),
    url: context.url,
    mainEntityOfPage: context.url,
    inLanguage: 'sv',
    image: context.imageUrl ? [context.imageUrl] : undefined,
    author: { '@type': 'Person', name: escapeHtml(context.author.name), url: context.author.url },
    datePublished: recipe.createdAt ? new Date(recipe.createdAt).toISOString() : undefined,
    dateModified: new Date(recipe.updatedAt).toISOString(),
    recipeYield: recipe.servings ? String(recipe.servings) : undefined,
    prepTime: duration(recipe.prepMinutes),
    cookTime: duration(recipe.cookMinutes),
    totalTime: duration(total),
    keywords: recipe.tags?.length ? escapeHtml(recipe.tags.join(', ')) : undefined,
    // Samma radformat som i redigeringsvyn, så att det går att tolka tillbaka.
    recipeIngredient: recipe.ingredients?.map((i) => {
      const main = [i.amount, i.unit, i.name].filter(Boolean).join(' ');
      return escapeHtml(i.note ? `${main}, ${i.note}` : main);
    }),
    recipeInstructions: recipe.steps?.map((s) => ({ '@type': 'HowToStep', text: escapeHtml(s.text) })),
  };
  return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
}

/** `<script>`-taggen. `<` kodas så att text som "</script>" i ett recept inte kan bryta sig ut. */
export function jsonLdScript(data: Record<string, unknown>): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Minuter som ISO 8601-tid, t.ex. 75 → "PT1H15M". */
function duration(minutes: number | undefined): string | undefined {
  if (!minutes || minutes <= 0) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}`;
}
