import type { RecipeDraft } from './recipes';
import type { Ingredient } from './types';
import type { PhotoRecipe } from '../../worker/photoRecipe';
import { prepareCoverImage } from '../cover/image';

/**
 * Tolkar ett recept från bilder (skärmdumpar, foton, handskrivna lappar) via Workern
 * (/api/import/photo), som skickar dem till Claude. Kräver inloggning med en roll.
 * Fel kastas med koderna i ImportView.
 */
export async function importRecipeFromImages(files: Blob[], accessToken: string | undefined): Promise<RecipeDraft> {
  if (!accessToken) throw new Error('not-logged-in');
  // Samma krympning som för omslagsbilder: mindre att skicka och tillräckligt skarpt för handstil.
  const images = await Promise.all(
    files.map(async (file) => {
      const image = await prepareCoverImage(file);
      return { mediaType: image.type, data: await toBase64(image) };
    }),
  );

  const res = await fetch('/api/import/photo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ images }),
  });
  if (res.status === 401) throw new Error('not-logged-in');
  if (res.status === 403) throw new Error('needs-role');
  if (res.status === 422) throw new Error('unreadable');
  if (res.status === 503) throw new Error('not-configured');
  if (!res.ok) throw new Error('fetch-failed');
  return photoRecipeToDraft((await res.json()) as PhotoRecipe);
}

/**
 * Gör om Claudes svar till ett utkast. Osäkra ord och att receptet är översatt står i
 * beskrivningen, så att man ser det när man granskar.
 */
export function photoRecipeToDraft(recipe: PhotoRecipe): RecipeDraft {
  if (!recipe.found) throw new Error('no-recipe');
  const title = recipe.title.trim();
  if (!title) throw new Error('missing-title');

  const description = [
    recipe.description?.trim(),
    recipe.author?.trim() && `Recept från ${recipe.author.trim()}`,
    recipe.translatedFrom?.trim() && `Översatt från ${recipe.translatedFrom.trim()}.`,
    recipe.uncertain.length > 0 && `Svårläst, kontrollera: ${recipe.uncertain.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    title,
    description: description || undefined,
    servings: positive(recipe.servings),
    prepMinutes: positive(recipe.prepMinutes),
    cookMinutes: positive(recipe.cookMinutes),
    ingredients: recipe.ingredients
      .filter((i) => i.name.trim())
      .map((i) => {
        const ingredient: Ingredient = { name: i.name.trim() };
        if (i.amount?.trim()) ingredient.amount = i.amount.trim();
        if (i.unit?.trim()) ingredient.unit = i.unit.trim();
        if (i.note?.trim()) ingredient.note = i.note.trim();
        if (i.group?.trim()) ingredient.group = i.group.trim();
        return ingredient;
      }),
    steps: recipe.steps.map((text) => text.trim()).filter(Boolean).map((text) => ({ text })),
    tags: [...new Set(recipe.tags.map((tag) => tag.trim().replace(/^#/, '').toLowerCase()).filter(Boolean))],
    source: { kind: recipe.source === 'instagram' ? 'instagram' : 'image' },
  };
}

function positive(n: number | null): number | undefined {
  return n && n > 0 ? n : undefined;
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // Data-URL:en börjar med "data:image/webp;base64,". API:et vill ha bara base64-delen.
    reader.onload = () => resolve(String(reader.result).split(',', 2)[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
