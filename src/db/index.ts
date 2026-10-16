import { shallowRef } from 'vue';
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

/**
 * Läs aldrig recept med .filter(), anyOf() eller each(): då läser Dexie med en cursor.
 * På en ny enhet är bilderna bara referenser, och Dexie Cloud hämtar dem från nätet mitt
 * i cursorn. Under tiden stängs transaktionen och frågan blir aldrig klar (oändlig spinner).
 * Hämta i stället med toArray(), get() eller where().equals() och filtrera i JS.
 */
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

/** Så länge får öppningen ta innan felrutan visas. Första synken kan ta en stund. */
const OPEN_TIMEOUT = 15_000;
const MAX_RETRY_DELAY = 30_000;

/** `failed` när öppningen misslyckats eller dröjer. Nya försök görs i bakgrunden. */
export const dbStatus = shallowRef<'opening' | 'open' | 'failed'>('opening');
/** Ökar varje gång databasen har öppnats, så att frågor som misslyckats kan köras om (se useLiveQuery). */
export const dbOpenCount = shallowRef(0);

let retryDelay = 2_000;
let retryTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Dexie Cloud väntar in den första synken innan databasen öppnas. Det sker på en ny
 * enhet, och en app på hemskärmen i iOS har egen, tom lagring. Om synken misslyckas
 * avvisar Dexie sedan alla frågor tills databasen öppnas igen, så försök på nytt.
 * Hänger synken kommer Dexie inte vidare alls, då hjälper bara att ladda om sidan.
 */
function openDatabase() {
  clearTimeout(retryTimer);
  retryTimer = undefined;
  const timeout = setTimeout(() => {
    if (dbStatus.value === 'opening') dbStatus.value = 'failed';
  }, OPEN_TIMEOUT);
  db.open()
    .then(() => {
      dbStatus.value = 'open';
      dbOpenCount.value++;
      retryDelay = 2_000;
    })
    .catch((error) => {
      console.error('Kunde inte öppna databasen', error);
      dbStatus.value = 'failed';
      retryTimer = setTimeout(openDatabase, retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
    })
    .finally(() => clearTimeout(timeout));
}

// Försök direkt när nätet kommer tillbaka, i stället för att vänta ut nästa försök.
addEventListener('online', () => {
  if (retryTimer) openDatabase();
});

// Öppna direkt. Dexie öppnar annars först vid första frågan, och innan dess läser
// Dexie Cloud inte in den sparade inloggningen: currentUser står kvar på isLoading.
openDatabase();
