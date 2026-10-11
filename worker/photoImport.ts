/**
 * Import av recept från bilder: skärmdumpar (ofta från Instagram), foton av kokböcker och
 * handskrivna lappar. Bilderna skickas till Claude, som svarar enligt PhotoRecipeSchema.
 * API-nyckeln finns bara här i Workern (hemligheten ANTHROPIC_API_KEY).
 */

import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { HttpError, json } from './http';
import { PhotoRecipeSchema } from './photoRecipe';

const MODEL = 'claude-opus-5-5';
const MAX_IMAGES = 5;
// Claude tar emot högst 5 MB per bild. Klienten krymper bilderna, så de brukar vara 100–500 kB.
const MAX_IMAGE_BASE64 = 5 * 1024 * 1024;
const MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

const SYSTEM = `Du skriver av recept från bilder till strukturerad data för en svensk receptapp.

Bilderna kan vara skärmdumpar (ofta Instagraminlägg där receptet står i bildtexten, ibland uppdelat på flera skärmdumpar), foton av kokbokssidor eller handskrivna lappar. Alla bilder i samma förfrågan hör till samma recept.

- Skriv av det som står. Hitta inte på ingredienser, mängder, steg eller tider som inte finns i bilderna.
- Skriv allt på svenska. Är receptet på ett annat språk, översätt titel, beskrivning, ingredienser, steg och taggar till naturlig svenska och ange originalspråket i translatedFrom. Är det redan på svenska, sätt translatedFrom till null.
- Använd svenska mått: msk, tsk, krm, dl, g och °C. Räkna om amerikanska och brittiska mått (cups, oz, lb, °F) till närmaste rimliga svenska mått, t.ex. 1 cup = 2,4 dl och 350 °F = 175 °C. Står receptet redan i svenska mått, skriv dem som de står, t.ex. "1 ½" och "msk".
- Lägg tillagningssätt som "finhackad" i note.
- Ett steg per moment. Dela upp långa stycken i logiska steg och ta bort numrering.
- Ignorera appens gränssnitt: gilla-markeringar, kommentarer, knappar, tidsstämplar och reklam.
- Taggar: högst fem korta taggar med gemener, t.ex. "vegetariskt" eller "bakning". Relevanta hashtags får bli taggar, utan #.
- description: en kort inledning om receptet har en, annars null. Upprepa inte ingredienser eller steg där.
- Svårläst handstil: skriv din bästa gissning och lista de osäkra orden i uncertain.
- Finns inget recept i bilderna: sätt found till false och lämna övriga fält tomma.`;

export interface PhotoImportEnv {
  ANTHROPIC_API_KEY?: string;
}

/** POST /api/import/photo med { images: [{ mediaType, data }] }, där data är base64. */
export async function importPhoto(request: Request, env: PhotoImportEnv): Promise<Response> {
  if (!env.ANTHROPIC_API_KEY) throw new HttpError(503, 'Bildimport är inte konfigurerad');
  const images = parseImages(await request.json().catch(() => null));

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, timeout: 120_000, maxRetries: 1 });
  let response;
  try {
    response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      // Handskrift kräver eftertanke, men det är ingen svår uppgift: medium räcker.
      output_config: { effort: 'medium', format: betaZodOutputFormat(PhotoRecipeSchema) },
      // Avböjer säkerhetsfiltren körs förfrågan om på den modell Anthropic rekommenderar.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            ...images.map((image) => ({
              type: 'image' as const,
              source: { type: 'base64' as const, media_type: image.mediaType, data: image.data },
            })),
            { type: 'text', text: 'Skriv av receptet.' },
          ],
        },
      ],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) throw new HttpError(429, 'För många förfrågningar just nu');
    if (error instanceof Anthropic.APIError) {
      console.error('Claude svarade med fel', error.status, error.message);
      throw new HttpError(502, 'Bilden kunde inte tolkas just nu');
    }
    throw error;
  }

  if (response.stop_reason === 'refusal') throw new HttpError(422, 'Bilden kunde inte tolkas');
  const recipe = response.parsed_output;
  if (!recipe || response.stop_reason === 'max_tokens') throw new HttpError(502, 'Bilden kunde inte tolkas just nu');
  return json(recipe);
}

function parseImages(body: unknown): { mediaType: MediaType; data: string }[] {
  const images = (body as { images?: unknown } | null)?.images;
  if (!Array.isArray(images) || images.length === 0 || images.length > MAX_IMAGES) {
    throw new HttpError(400, `Skicka 1–${MAX_IMAGES} bilder`);
  }
  return images.map((image: { mediaType?: unknown; data?: unknown }) => {
    const { mediaType, data } = image ?? {};
    if (!MEDIA_TYPES.includes(mediaType as MediaType) || typeof data !== 'string' || !data) {
      throw new HttpError(400, 'Bilden har ett format som inte stöds');
    }
    if (data.length > MAX_IMAGE_BASE64) throw new HttpError(413, 'Bilden är för stor');
    return { mediaType: mediaType as MediaType, data };
  });
}
