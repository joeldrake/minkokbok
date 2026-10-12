import Dexie from 'dexie';
import dexieCloud, { type DexieCloudTable } from 'dexie-cloud-addon';
import type { Bookmark, Follow, Profile, Recipe } from './types';
import { watchSyncRejections } from './syncRejections';

/** Realm som alla, även utloggade besökare, kan läsa. */
export const PUBLIC_REALM = 'rlm-public';

/**
 * Roller i den publika realmen. De definieras i dexie-cloud/roles.json och delas ut
 * med en medlemsrad i rlm-public. Konton utan roll kan bara läsa det publika.
 */
export const ROLES = { member: 'member', admin: 'admin' } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

const databaseUrl = import.meta.env.VITE_DEXIE_CLOUD_URL as string | undefined;

/** Utan Dexie Cloud-URL körs appen helt lokalt, utan inloggning och synk. */
export const cloudEnabled = Boolean(databaseUrl);

export const db = new Dexie('minkokbok', { addons: [dexieCloud] }) as Dexie & {
  recipes: DexieCloudTable<Recipe, 'id'>;
  profiles: DexieCloudTable<Profile, 'id'>;
  follows: DexieCloudTable<Follow, 'id'>;
  bookmarks: DexieCloudTable<Bookmark, 'id'>;
};

db.version(1).stores({
  recipes: '@id, title, updatedAt, owner, realmId',
  profiles: '@id, username, owner',
});

// Följningar och bokmärken hamnar i användarens privata realm, så bara man själv ser dem.
db.version(2).stores({
  follows: '@id, followee',
  bookmarks: '@id, recipeId',
});

if (databaseUrl) {
  watchSyncRejections(databaseUrl);
  db.cloud.configure({
    databaseUrl,
    requireAuth: false,
    // Inloggningsrutan ritas av LoginDialog.vue i stället för Dexie Clouds inbyggda.
    customLoginGui: true,
  });
}

// Öppna direkt. Dexie öppnar annars först vid första frågan, och innan dess läser
// Dexie Cloud inte in den sparade inloggningen: currentUser står kvar på isLoading.
db.open().catch((error) => console.error('Kunde inte öppna databasen', error));
