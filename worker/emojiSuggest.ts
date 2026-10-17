/**
 * Emojiförslag till omslag: Claude får titel, beskrivning och ingredienser och föreslår
 * några emojis. En liten, snabb modell räcker. Kostar per anrop, så det kräver en roll.
 */

import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { HttpError, json } from './http';

const MODEL = 'claude-haiku-5-5';
const MAX_TEXT = 2000;
const MAX_INGREDIENTS = 100;

const SYSTEM = `Du väljer emojis till omslaget för ett recept i en svensk receptapp.

- Föreslå ungefär fem emojis som tillsammans får en att känna igen rätten: huvudråvaror, typ av rätt, gärna något som säger något om stämningen eller ursprunget.
- Bara en emoji per post, inga bokstäver eller förklaringar.
- Undvik basvaror som inte säger något om rätten, t.ex. salt, olja och mjöl, om de inte är poängen.
- Ingen emoji två gånger.`;

const EmojiSchema = z.object({
  emojis: z.array(z.string()).describe('Ungefär fem emojis, viktigast först'),
});

const RequestSchema = z.object({
  title: z.string().trim().min(1).max(MAX_TEXT),
  description: z.string().max(MAX_TEXT).optional(),
  ingredients: z.array(z.string().max(200)).max(MAX_INGREDIENTS),
});

export interface EmojiSuggestEnv {
  ANTHROPIC_API_KEY?: string;
}

/** POST /api/cover/emojis med { title, description?, ingredients: string[] }. Svarar { emojis }. */
export async function suggestCoverEmojis(request: Request, env: EmojiSuggestEnv): Promise<Response> {
  if (!env.ANTHROPIC_API_KEY) throw new HttpError(503, 'Emojiförslag är inte konfigurerade');
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, 'Receptet saknar titel');
  const { title, description, ingredients } = parsed.data;

  const recipe = [
    `Titel: ${title}`,
    description?.trim() && `Beskrivning: ${description.trim()}`,
    ingredients.length > 0 && `Ingredienser:\n${ingredients.map((i) => `- ${i}`).join('\n')}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 30_000, maxRetries: 1 });
  let response;
  try {
    response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: 'low', format: betaZodOutputFormat(EmojiSchema) },
      system: SYSTEM,
      messages: [{ role: 'user', content: recipe }],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) throw new HttpError(429, 'För många förfrågningar just nu');
    if (error instanceof Anthropic.APIError) {
      console.error('Claude svarade med fel', error.status, error.message);
      throw new HttpError(502, 'Inga förslag just nu');
    }
    throw error;
  }

  const emojis = response.parsed_output?.emojis;
  if (response.stop_reason === 'refusal' || !emojis) throw new HttpError(502, 'Inga förslag just nu');
  return json({ emojis });
}
