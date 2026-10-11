import { db, PUBLIC_REALM } from '.';
import type { Recipe } from './types';

export type RecipeDraft = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;

export function emptyDraft(): RecipeDraft {
  return { title: '', ingredients: [], steps: [], tags: [] };
}

export async function createRecipe(draft: RecipeDraft): Promise<string> {
  const now = Date.now();
  return db.recipes.add({ ...draft, createdAt: now, updatedAt: now });
}

export async function updateRecipe(id: string, draft: RecipeDraft): Promise<void> {
  await db.recipes.update(id, { ...draft, updatedAt: Date.now() });
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.recipes.delete(id);
}

export function isPublic(recipe: { realmId?: string }): boolean {
  return recipe.realmId === PUBLIC_REALM;
}

/** Flyttar receptet mellan användarens privata realm och den publika. */
export async function setRecipePublic(id: string, makePublic: boolean): Promise<void> {
  const userId = db.cloud.currentUserId;
  // Användarens privata realm har samma id som användaren.
  await db.recipes.update(id, { realmId: makePublic ? PUBLIC_REALM : userId });
}
