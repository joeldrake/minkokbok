import type { RouteLocationRaw } from 'vue-router';
import { db, PUBLIC_REALM } from '.';
import type { Recipe } from './types';
import { slugify, uniqueSlug } from './slug';
import { renderOgImage } from '../cover/ogImage';
import { palette } from '../theme/palette';

export type RecipeDraft = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'slug' | 'slugHistory' | 'ogImage'>;

type StoredRecipe = Recipe & { owner?: string; realmId?: string };

export function emptyDraft(): RecipeDraft {
  return { title: '', ingredients: [], steps: [], tags: [] };
}

export async function createRecipe(draft: RecipeDraft): Promise<string> {
  const now = Date.now();
  const slug = uniqueSlug(draft.title, await takenSlugs(db.cloud.currentUserId));
  return db.recipes.add({ ...draft, slug, createdAt: now, updatedAt: now });
}

export async function updateRecipe(id: string, draft: RecipeDraft): Promise<void> {
  const existing: StoredRecipe | undefined = await db.recipes.get(id);
  const changes: Partial<Recipe> = { ...draft, updatedAt: Date.now() };
  if (existing) {
    Object.assign(changes, await slugChanges(existing, draft.title));
    if (isPublic(existing)) changes.ogImage = await ogImageFor(draft);
  }
  await db.recipes.update(id, changes);
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.recipes.delete(id);
}

export function isPublic(recipe: { realmId?: string }): boolean {
  return recipe.realmId === PUBLIC_REALM;
}

/**
 * Den publika adressen /[användarnamn]/[slug] för ett publikt recept. Ger undefined för
 * privata recept och för publika recept som saknar slug, som då länkas till /recept/:id.
 */
export function publicRecipeRoute(
  recipe: { slug?: string; realmId?: string },
  username: string | undefined,
): RouteLocationRaw | undefined {
  if (!username || !recipe.slug || !isPublic(recipe)) return undefined;
  return { name: 'publicRecipe', params: { username, slug: recipe.slug } };
}

/** Flyttar receptet mellan användarens privata realm och den publika. */
export async function setRecipePublic(id: string, makePublic: boolean): Promise<void> {
  const userId = db.cloud.currentUserId;
  const recipe: StoredRecipe | undefined = await db.recipes.get(id);
  if (!recipe) return;
  if (!makePublic) {
    // Användarens privata realm har samma id som användaren. Förhandsbilden behövs bara publikt.
    await db.recipes.update(id, { realmId: userId, ogImage: undefined });
    return;
  }
  await db.recipes.update(id, {
    realmId: PUBLIC_REALM,
    // Recept som skapades innan det fanns slugs får en när de publiceras.
    ...(recipe.slug ? {} : await slugChanges(recipe, recipe.title)),
    ogImage: await ogImageFor(recipe),
  });
}

/**
 * Hittar ett publikt recept på /[användarnamn]/[slug]. Även gamla slugs matchar, så att
 * länkar som delats innan titeln ändrades fortsätter fungera.
 */
export async function findPublicRecipe(owner: string, slug: string): Promise<StoredRecipe | undefined> {
  const recipes: StoredRecipe[] = await db.recipes
    .where('owner')
    .equals(owner)
    .filter((r) => isPublic(r) && (r.slug === slug || Boolean(r.slugHistory?.includes(slug))))
    .toArray();
  // Den aktuella slugen går före en gammal, om två recept skulle matcha.
  return recipes.find((r) => r.slug === slug) ?? recipes[0];
}

/**
 * Ny slug när titeln ändrats så att adressen följer titeln. Den gamla sparas i
 * historiken. Har titeln inte ändrats (eller bara skiljetecken) behålls slugen.
 */
async function slugChanges(recipe: StoredRecipe, title: string): Promise<Partial<Recipe>> {
  if (recipe.slug && slugify(title) === slugify(recipe.title)) return {};
  const taken = await takenSlugs(recipe.owner ?? db.cloud.currentUserId, recipe.id);
  // Receptets egna gamla slugs får återanvändas, t.ex. om titeln ändras tillbaka.
  for (const own of recipe.slugHistory ?? []) taken.delete(own);
  const slug = uniqueSlug(title, taken);
  if (slug === recipe.slug) return {};
  const history = [...(recipe.slugHistory ?? []), ...(recipe.slug ? [recipe.slug] : [])].filter((s) => s !== slug);
  return { slug, slugHistory: history.length ? [...new Set(history)] : undefined };
}

/** Slugs (även gamla) som ägarens andra recept använder. */
async function takenSlugs(owner: string | undefined, exceptId?: string): Promise<Set<string>> {
  const taken = new Set<string>();
  const recipes: StoredRecipe[] = await db.recipes.filter((r: StoredRecipe) => r.owner === owner && r.id !== exceptId).toArray();
  for (const r of recipes) {
    if (r.slug) taken.add(r.slug);
    for (const s of r.slugHistory ?? []) taken.add(s);
  }
  return taken;
}

/**
 * Ritar om förhandsbilden. Den skapas om vid varje sparning av ett publikt recept, så den
 * alltid följer titel och omslag. Går det inte att rita sparas receptet ändå, utan bild.
 */
async function ogImageFor(recipe: Pick<Recipe, 'title' | 'cover'>): Promise<Blob | undefined> {
  try {
    return await renderOgImage(recipe, palette.value);
  } catch (error) {
    console.error('Kunde inte skapa förhandsbilden', error);
    return undefined;
  }
}
