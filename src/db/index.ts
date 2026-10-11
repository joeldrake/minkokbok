import Dexie from 'dexie';
import dexieCloud, { type DexieCloudTable } from 'dexie-cloud-addon';
import type { Profile, Recipe } from './types';

/** Realm som alla, även utloggade besökare, kan läsa. */
export const PUBLIC_REALM = 'rlm-public';

const databaseUrl = import.meta.env.VITE_DEXIE_CLOUD_URL as string | undefined;

/** Utan Dexie Cloud-URL körs appen helt lokalt, utan inloggning och synk. */
export const cloudEnabled = Boolean(databaseUrl);

export const db = new Dexie('minkokbok', { addons: [dexieCloud] }) as Dexie & {
  recipes: DexieCloudTable<Recipe, 'id'>;
  profiles: DexieCloudTable<Profile, 'id'>;
};

db.version(1).stores({
  recipes: '@id, title, updatedAt, owner, realmId',
  profiles: '@id, username, owner',
});

if (databaseUrl) {
  db.cloud.configure({
    databaseUrl,
    requireAuth: false,
    // Inloggningsrutan ritas av LoginDialog.vue i stället för Dexie Clouds inbyggda.
    customLoginGui: true,
  });
}
