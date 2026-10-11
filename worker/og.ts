/**
 * Förhandsvisningar för publika recept. Läser bara den publika realmen via Dexie Clouds
 * /public-endpoints, som inte kräver inloggning, så Workern kan aldrig råka visa något privat.
 */

import type { Env } from './index';

const SITE_NAME = 'Min Kokbok';
// Måste stämma med OG_WIDTH och OG_HEIGHT i src/cover/ogImage.ts
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

/** Första delen av sökvägar som tillhör appen och aldrig är ett användarnamn. */
const APP_PATHS = new Set(['recept', 'profil', 'admin', 'api', 'og', 'assets', 'icons', 'splash']);

interface PublicProfile {
  username: string;
  displayName: string;
  owner: string;
}

/** Blob som Dexie Cloud har lagt i sin bloblagring, eller (om den är liten) skickar inline. */
type StoredBlob = { _bt: string; ref: string; ct?: string } | { $t: 'Blob'; v: string };

interface PublicRecipe {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  slugHistory?: string[];
  ogImage?: StoredBlob;
  updatedAt: number;
  realmId: string;
}

/**
 * Appens index.html med titel och Open Graph-taggar för receptet på /[användarnamn]/[slug].
 * Ger null när sökvägen inte är ett publikt recept, så att den serveras som vanligt.
 * En gammal slug skickas vidare till den aktuella.
 */
export async function publicRecipePage(request: Request, url: URL, env: Env): Promise<Response | null> {
  const match = /^\/([a-z0-9-]{3,30})\/([a-z0-9-]+)\/?$/.exec(url.pathname);
  if (!match || APP_PATHS.has(match[1]) || request.method !== 'GET') return null;
  const [, username, slug] = match;

  const [profile] = await publicQuery<PublicProfile>(env, 'profiles', { username });
  if (!profile) return null;
  const recipes = await publicQuery<PublicRecipe>(env, 'recipes', { owner: profile.owner });
  const recipe =
    recipes.find((r) => r.slug === slug) ?? recipes.find((r) => Boolean(r.slugHistory?.includes(slug)));
  if (!recipe?.slug) return null;
  if (recipe.slug !== slug) return Response.redirect(new URL(`/${username}/${recipe.slug}`, url).toString(), 301);

  const page = await env.ASSETS.fetch(new Request(new URL('/', url), request));
  const canonical = new URL(`/${username}/${recipe.slug}`, url).toString();
  const title = `${recipe.title} – ${SITE_NAME}`;
  const description = truncate(recipe.description || `Ett recept av ${profile.displayName} på ${SITE_NAME}.`, 200);
  const image = recipe.ogImage
    ? { url: new URL(`/og/${encodeURIComponent(recipe.id)}.jpg?v=${recipe.updatedAt}`, url).toString(), width: OG_WIDTH, height: OG_HEIGHT }
    : { url: new URL('/icons/icon-512.png', url).toString(), width: 512, height: 512 };

  const tags = [
    ['link', { rel: 'canonical', href: canonical }],
    ['meta', { name: 'description', content: description }],
    ['meta', { property: 'og:type', content: 'article' }],
    ['meta', { property: 'og:site_name', content: SITE_NAME }],
    ['meta', { property: 'og:locale', content: 'sv_SE' }],
    ['meta', { property: 'og:url', content: canonical }],
    ['meta', { property: 'og:title', content: recipe.title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:image', content: image.url }],
    ['meta', { property: 'og:image:width', content: String(image.width) }],
    ['meta', { property: 'og:image:height', content: String(image.height) }],
    ['meta', { property: 'og:image:alt', content: recipe.title }],
    ['meta', { name: 'twitter:card', content: recipe.ogImage ? 'summary_large_image' : 'summary' }],
  ] as const;
  const html = tags
    .map(([tag, attributes]) => {
      const attrs = Object.entries(attributes).map(([k, v]) => `${k}="${escapeHtml(v)}"`);
      return `<${tag} ${attrs.join(' ')} />`;
    })
    .join('\n    ');

  const response = new HTMLRewriter()
    .on('title', { element: (el) => void el.setInnerContent(title) })
    .on('head', { element: (el) => void el.append(`    ${html}\n  `, { html: true }) })
    .transform(page);
  const headers = new Headers(response.headers);
  // Kort cache, så att en ny titel eller bild syns snart i nya förhandsvisningar.
  headers.set('Cache-Control', 'public, max-age=300');
  return new Response(response.body, { status: 200, headers });
}

/** Förhandsbilden för /og/[recept-id].jpg. */
export async function ogImageResponse(url: URL, env: Env): Promise<Response> {
  const id = /^\/og\/([^/]+)\.jpg$/.exec(url.pathname)?.[1];
  const [recipe] = id ? await publicQuery<PublicRecipe>(env, 'recipes', { id: decodeURIComponent(id) }) : [];
  const blob = recipe?.ogImage;
  if (!blob) return new Response('Hittades inte', { status: 404 });

  let body: BodyInit;
  let contentType = 'image/jpeg';
  if ('ref' in blob) {
    // Blobbar i den publika realmen går att hämta utan inloggning.
    const res = await fetch(`${env.DEXIE_DB_URL}/blob/${blob.ref}`);
    if (!res.ok) return new Response('Hittades inte', { status: 404 });
    body = res.body!;
    contentType = blob.ct ?? contentType;
  } else {
    body = Uint8Array.from(atob(blob.v), (c) => c.charCodeAt(0));
  }
  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      // Adressen innehåller ?v=updatedAt, så en ny bild får en ny adress.
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

async function publicQuery<T>(env: Env, table: string, filter: Record<string, string>): Promise<T[]> {
  const res = await fetch(`${env.DEXIE_DB_URL}/public/${table}?${new URLSearchParams(filter)}`);
  if (!res.ok) throw new Error(`Dexie Cloud GET /public/${table} svarade ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as T[] | { data: T[] };
  const rows = Array.isArray(body) ? body : body.data;
  // Filtrera även här, ifall servern skulle ignorera någon parameter.
  return rows.filter((row) => Object.entries(filter).every(([k, v]) => (row as Record<string, unknown>)[k] === v));
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Typer för Cloudflares HTMLRewriter (projektet använder inte @cloudflare/workers-types) ───

interface RewriterElement {
  setInnerContent(content: string, options?: { html?: boolean }): RewriterElement;
  append(content: string, options?: { html?: boolean }): RewriterElement;
}

declare class HTMLRewriter {
  on(selector: string, handlers: { element?(element: RewriterElement): void }): HTMLRewriter;
  transform(response: Response): Response;
}
