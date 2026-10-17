/**
 * Worker framför appen. Statiska filer serveras som förut; /api/* hanteras här.
 *
 * Adminfunktionerna (lista konton, sätta roller, ta bort konton) kräver Dexie Clouds
 * REST-API med klientnyckeln, som aldrig får skickas till webbläsaren.
 *
 * Receptimport från webbsidor (/api/import) är öppen för alla inloggade, se import.ts.
 * Import från bilder (/api/import/photo) anropar Claude och kostar per anrop, så den kräver
 * en roll (member eller admin), se photoImport.ts. Detsamma gäller emojiförslag till omslag
 * (/api/cover/emojis), se emojiSuggest.ts.
 *
 * Publika receptsidor (/[användarnamn]/[slug]) får Open Graph-taggar och schema.org-data inlagda
 * i HTML:en, eftersom de som hämtar förhandsvisningar (Facebook, Slack, iMessage …) och
 * sökmotorer inte alltid kör JavaScript.
 */

import { HttpError, json } from './http';
import { importImage, importPage } from './import';
import { suggestCoverEmojis } from './emojiSuggest';
import { importPhoto } from './photoImport';
import { ogImageResponse, publicRecipePage } from './og';

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DEXIE_DB_URL: string;
  DEXIE_CLIENT_ID: string;
  DEXIE_CLIENT_SECRET: string;
  ANTHROPIC_API_KEY?: string;
}

const PUBLIC_REALM = 'rlm-public';
const ROLES = ['member', 'admin'] as const;
type Role = (typeof ROLES)[number];

interface Member {
  id: string;
  realmId: string;
  userId?: string;
  email?: string;
  roles?: string[];
  accepted?: string;
  rejected?: string;
}

interface DexieUser {
  userId: string;
  type?: string;
  created?: string;
  lastLogin?: string;
  evalDaysLeft?: number;
  validUntil?: string;
  deactivated?: string;
  data?: { email?: string; displayName?: string };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      try {
        if (url.pathname.startsWith('/og/')) return await ogImageResponse(url, env);
        return (await publicRecipePage(request, url, env)) ?? env.ASSETS.fetch(request);
      } catch (error) {
        // Går Dexie Cloud inte att nå visas sidan ändå, bara utan förhandsvisning.
        console.error(error);
        return env.ASSETS.fetch(request);
      }
    }
    try {
      return await handleApi(request, url, env);
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      console.error(error);
      return json({ error: 'Internt fel' }, 500);
    }
  },
};

async function handleApi(request: Request, url: URL, env: Env): Promise<Response> {
  if (url.pathname === '/api/import/photo' && request.method === 'POST') {
    await requireMember(request, env);
    return importPhoto(request, env);
  }

  if (url.pathname === '/api/cover/emojis' && request.method === 'POST') {
    await requireMember(request, env);
    return suggestCoverEmojis(request, env);
  }

  if (url.pathname.startsWith('/api/import') && request.method === 'GET') {
    await requireUser(request, env);
    if (url.pathname === '/api/import') return importPage(url);
    if (url.pathname === '/api/import/image') return importImage(url);
    throw new HttpError(404, 'Hittades inte');
  }

  const caller = await requireAdmin(request, env);

  if (url.pathname === '/api/admin/users' && request.method === 'GET') {
    const [users, members] = await Promise.all([listUsers(env), publicMembers(env)]);
    return json(
      users.map((u) => ({
        userId: u.userId,
        email: u.data?.email ?? (u.userId.includes('@') ? u.userId : undefined),
        displayName: u.data?.displayName,
        license: u.type,
        evalDaysLeft: u.evalDaysLeft,
        created: u.created,
        lastLogin: u.lastLogin,
        deactivated: Boolean(u.deactivated),
        role: roleOf(members.filter((m) => m.userId === u.userId)),
      })),
    );
  }

  const match = /^\/api\/admin\/users\/([^/]+)(\/role)?$/.exec(url.pathname);
  if (match) {
    const userId = decodeURIComponent(match[1]);

    if (match[2] && request.method === 'PUT') {
      const { role } = (await request.json()) as { role: Role | null };
      if (role !== null && !ROLES.includes(role)) throw new HttpError(400, 'Okänd roll');
      if (userId === caller && role !== 'admin') throw new HttpError(400, 'Du kan inte ta bort din egen admin-roll');
      await setRole(env, userId, role);
      return json({ ok: true });
    }

    if (!match[2] && request.method === 'DELETE') {
      if (userId === caller) throw new HttpError(400, 'Du kan inte ta bort ditt eget konto här');
      await setRole(env, userId, null);
      await dexie(env, `/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
      return json({ ok: true });
    }
  }

  throw new HttpError(404, 'Hittades inte');
}

/**
 * Kontrollerar anroparens Dexie Cloud-token och ger användarens id.
 * Tokenet valideras genom att Dexie Cloud självt får svara på ett anrop med det.
 */
async function requireUser(request: Request, env: Env): Promise<string> {
  const token = /^Bearer (.+)$/.exec(request.headers.get('Authorization') ?? '')?.[1];
  if (!token) throw new HttpError(401, 'Inte inloggad');

  const check = await fetch(`${env.DEXIE_DB_URL}/my/members`, { headers: { Authorization: `Bearer ${token}` } });
  if (!check.ok) throw new HttpError(401, 'Ogiltig eller utgången inloggning');
  return jwtSubject(token);
}

/** Som requireUser, men kräver en roll (member eller admin) i den publika realmen. */
async function requireMember(request: Request, env: Env): Promise<string> {
  const userId = await requireUser(request, env);
  const members = (await publicMembers(env)).filter((m) => m.userId === userId);
  if (!roleOf(members)) throw new HttpError(403, 'Kräver medlemskap');
  return userId;
}

/** Som requireUser, men kräver dessutom admin-rollen. */
async function requireAdmin(request: Request, env: Env): Promise<string> {
  const userId = await requireUser(request, env);
  const members = (await publicMembers(env)).filter((m) => m.userId === userId);
  if (roleOf(members) !== 'admin') throw new HttpError(403, 'Kräver admin-behörighet');
  return userId;
}

/** Läser `sub` ur ett JWT. Signaturen har redan kontrollerats av Dexie Cloud ovan. */
function jwtSubject(token: string): string {
  const payload = token.split('.')[1];
  if (!payload) throw new HttpError(401, 'Ogiltig token');
  const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { sub?: string };
  if (!claims.sub) throw new HttpError(401, 'Ogiltig token');
  return claims.sub;
}

/** Högsta giltiga rollen bland användarens medlemsrader i den publika realmen. */
function roleOf(members: Member[]): Role | null {
  const roles = members.filter((m) => m.accepted && !m.rejected).flatMap((m) => m.roles ?? []);
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('member')) return 'member';
  return null;
}

async function setRole(env: Env, userId: string, role: Role | null) {
  const existing = (await publicMembers(env)).filter((m) => m.userId === userId);
  for (const m of existing) {
    await dexie(env, `/all/members/${encodeURIComponent(m.id)}`, { method: 'DELETE' });
  }
  if (!role) return;
  const member: Member = {
    id: `mmb-pub-${userId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    realmId: PUBLIC_REALM,
    userId,
    email: userId.includes('@') ? userId : undefined,
    roles: [role],
    // Utan accepted räknas raden som en obesvarad inbjudan och ger ingen behörighet.
    accepted: new Date().toISOString(),
  };
  await dexie(env, '/all/members', { method: 'POST', body: JSON.stringify([member]) });
}

async function listUsers(env: Env): Promise<DexieUser[]> {
  const users: DexieUser[] = [];
  let pagingKey: string | undefined;
  do {
    const query = new URLSearchParams({ limit: '1000' });
    if (pagingKey) query.set('pagingKey', pagingKey);
    const page = (await dexie(env, `/users?${query}`)) as
      | DexieUser[]
      | { data: DexieUser[]; hasMore?: boolean; pagingKey?: string };
    if (Array.isArray(page)) return page;
    users.push(...page.data);
    pagingKey = page.hasMore ? page.pagingKey : undefined;
  } while (pagingKey);
  return users;
}

async function publicMembers(env: Env): Promise<Member[]> {
  const res = (await dexie(env, `/all/members?realmId=${PUBLIC_REALM}`)) as Member[] | { data: Member[] };
  const members = Array.isArray(res) ? res : res.data;
  return members.filter((m) => m.realmId === PUBLIC_REALM);
}

// ─── Dexie Cloud REST ────────────────────────────────────────────────────────

let cachedToken: { value: string; expires: number } | undefined;

async function serverToken(env: Env): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value;
  const res = await fetch(`${env.DEXIE_DB_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: env.DEXIE_CLIENT_ID,
      client_secret: env.DEXIE_CLIENT_SECRET,
      scopes: ['ACCESS_DB', 'GLOBAL_READ', 'GLOBAL_WRITE'],
    }),
  });
  if (!res.ok) throw new Error(`Dexie Cloud /token svarade ${res.status}`);
  const body = (await res.json()) as { accessToken: string; accessTokenExpiration?: number };
  cachedToken = { value: body.accessToken, expires: body.accessTokenExpiration ?? Date.now() + 5 * 60_000 };
  return body.accessToken;
}

async function dexie(env: Env, path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${env.DEXIE_DB_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await serverToken(env)}` },
  });
  if (!res.ok) throw new Error(`Dexie Cloud ${init.method ?? 'GET'} ${path} svarade ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
