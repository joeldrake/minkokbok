import type { RecipeDraft } from './recipes';
import { parseRecipeJsonLd } from './importJsonLd';
import { prepareCoverImage } from '../cover/image';

/**
 * Hämtar ett recept från en webbsida via Workern (/api/import) och tolkar sidans
 * schema.org-data. Kräver inloggning. Fel kastas med koderna i ImportView.
 */
export async function importRecipeFromUrl(url: string, accessToken: string | undefined): Promise<RecipeDraft> {
  if (!accessToken) throw new Error('not-logged-in');
  const headers = { Authorization: `Bearer ${accessToken}` };

  const res = await fetch(`/api/import?${new URLSearchParams({ url: normalizeUrl(url) })}`, { headers });
  if (res.status === 400) throw new Error('invalid-url');
  if (res.status === 401) throw new Error('not-logged-in');
  if (!res.ok) throw new Error('fetch-failed');
  const page = (await res.json()) as { url: string; jsonLd: string[] };

  const { draft, imageUrl } = parseRecipeJsonLd(page.jsonLd, page.url);
  if (imageUrl) {
    // Receptet går att använda även om bilden inte kan hämtas.
    try {
      const image = await fetch(`/api/import/image?${new URLSearchParams({ url: imageUrl })}`, { headers });
      if (image.ok) draft.cover = { kind: 'photo', image: await prepareCoverImage(await image.blob()) };
    } catch (error) {
      console.warn('Kunde inte hämta receptets bild', error);
    }
  }
  return draft;
}

/** Tillåter adresser utan "https://", t.ex. "ica.se/recept/…". */
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
