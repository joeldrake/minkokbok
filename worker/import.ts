/**
 * Import från webbsidor. Webbläsaren får inte läsa andra sajter (CORS), så Workern hämtar
 * sidan och skickar tillbaka dess JSON-LD-block. Klienten tolkar dem (src/db/importJsonLd.ts).
 * Receptbilden hämtas på samma sätt, så att klienten kan krympa den innan den sparas.
 */

import { HttpError, json } from './http';

const MAX_PAGE_BYTES = 3_000_000;
const MAX_IMAGE_BYTES = 10_000_000;
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 10_000;

/** GET /api/import?url=… → { url, jsonLd: string[] }, där url är adressen efter omdirigeringar. */
export async function importPage(requestUrl: URL): Promise<Response> {
  const { response, url } = await fetchExternal(requestUrl.searchParams.get('url'), 'text/html,application/xhtml+xml');
  const type = response.headers.get('Content-Type') ?? '';
  if (!/html/i.test(type)) throw new HttpError(502, 'Adressen är ingen webbsida');
  const html = decode(await readCapped(response, MAX_PAGE_BYTES), type);
  return json({ url, jsonLd: jsonLdBlocks(html) });
}

/** GET /api/import/image?url=… → bilden som den är. */
export async function importImage(requestUrl: URL): Promise<Response> {
  const { response } = await fetchExternal(requestUrl.searchParams.get('url'), 'image/*');
  const type = response.headers.get('Content-Type') ?? '';
  if (!type.startsWith('image/')) throw new HttpError(502, 'Adressen är ingen bild');
  return new Response(await readCapped(response, MAX_IMAGE_BYTES), { headers: { 'Content-Type': type } });
}

/** De flesta sidor är UTF-8, men äldre svenska sajter kan vara ISO-8859-1. */
function decode(bytes: Uint8Array, contentType: string): string {
  const charset = /charset=["']?([\w-]+)/i.exec(contentType)?.[1];
  try {
    return new TextDecoder(charset ?? 'utf-8').decode(bytes);
  } catch {
    return new TextDecoder().decode(bytes);
  }
}

/** Innehållet i alla `<script type="application/ld+json">`. Plustecknet kan vara skrivet som entitet (Arla). */
export function jsonLdBlocks(html: string): string[] {
  const pattern =
    /<script\b[^>]*\btype\s*=\s*["']?application\/ld(?:\+|&#x0*2b;|&#0*43;|&plus;)json["']?[^>]*>([\s\S]*?)<\/script\s*>/gi;
  return [...html.matchAll(pattern)].map((m) => m[1].trim()).filter(Boolean);
}

/**
 * Hämtar en extern adress. Omdirigeringar följs för hand, så att varje steg kontrolleras
 * med samma regler som den första adressen.
 */
async function fetchExternal(raw: string | null, accept: string): Promise<{ response: Response; url: string }> {
  let url = checkUrl(raw);
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    let response: Response;
    try {
      response = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          Accept: accept,
          'Accept-Language': 'sv,en;q=0.8',
          // En del sajter svarar inte alls utan en webbläsarlik User-Agent.
          'User-Agent': 'Mozilla/5.0 (compatible; MinKokbok/1.0; receptimport)',
        },
      });
    } catch {
      throw new HttpError(502, 'Sidan gick inte att nå');
    }
    const location = response.headers.get('Location');
    if (response.status >= 300 && response.status < 400 && location) {
      url = checkUrl(new URL(location, url).href);
      continue;
    }
    if (!response.ok) throw new HttpError(502, `Sidan svarade ${response.status}`);
    return { response, url: url.href };
  }
  throw new HttpError(502, 'För många omdirigeringar');
}

/**
 * Bara vanliga webbadresser på standardportar. IP-adresser och interna namn nekas, så att
 * endpointen inte kan användas för att nå annat än publika sajter.
 */
function checkUrl(raw: string | null): URL {
  let url: URL;
  try {
    url = new URL(raw ?? '');
  } catch {
    throw new HttpError(400, 'Ogiltig adress');
  }
  const host = url.hostname.toLowerCase();
  const ok =
    /^https?:$/.test(url.protocol) &&
    !url.username &&
    !url.password &&
    !url.port &&
    host.includes('.') &&
    !host.startsWith('[') &&
    !/^[\d.]+$/.test(host) &&
    !/(^|\.)(localhost|local|internal|lan|home\.arpa)$/.test(host);
  if (!ok) throw new HttpError(400, 'Ogiltig adress');
  return url;
}

async function readCapped(response: Response, max: number): Promise<Uint8Array<ArrayBuffer>> {
  const length = Number(response.headers.get('Content-Length'));
  if (length > max) throw new HttpError(502, 'Filen är för stor');
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(502, 'Filen är för stor');
    }
    chunks.push(value);
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}
