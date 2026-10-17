import type { Ingredient } from '../db/types';
import { parseEmojis } from './emoji';

/**
 * Ber Claude om emojis till ett omslag via Workern (/api/cover/emojis).
 * Kräver inloggning med en roll (member eller admin).
 */
export async function suggestEmojisWithAi(
  recipe: { title: string; description: string; ingredients: Ingredient[] },
  accessToken: string | undefined,
): Promise<string[]> {
  if (!accessToken) throw new Error('not-logged-in');
  const res = await fetch('/api/cover/emojis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({
      title: recipe.title,
      description: recipe.description || undefined,
      ingredients: recipe.ingredients.map((i) => i.name),
    }),
  });
  if (!res.ok) throw new Error(`Emojiförslag svarade ${res.status}`);
  const { emojis } = (await res.json()) as { emojis: string[] };
  // Samma tolkning som fältet: bara riktiga emojis och högst så många som får plats.
  const result = [...new Set(parseEmojis(emojis.join(' ')))];
  if (result.length === 0) throw new Error('Inga emojis i svaret');
  return result;
}
