import { shallowRef } from 'vue';

/** En ändring som servern vägrade ta emot vid synk, t.ex. för att behörighet saknas. */
export interface SyncRejection {
  name: string;
  message: string;
  txid?: string;
  /** Tabellen som ändringen gällde, om den går att utläsa ur meddelandet. */
  table?: string;
  at: number;
}

/** Senaste avvisningarna från servern, nyast sist. */
export const syncRejections = shallowRef<SyncRejection[]>([]);

export function clearSyncRejections() {
  syncRejections.value = [];
}

/**
 * Dexie Cloud skickar avvisade ändringar i fältet `rejections` i svaret från /sync,
 * men addonen gör inget med dem: ändringen försvinner bara tyst vid nästa synk.
 * Vi läser därför en kopia av svaret för att kunna visa ett begripligt felmeddelande.
 */
export function watchSyncRejections(databaseUrl: string) {
  const syncUrl = `${databaseUrl.replace(/\/$/, '')}/sync`;
  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url === syncUrl && response.ok) {
      response
        .clone()
        .json()
        .then((body: { rejections?: Omit<SyncRejection, 'at' | 'table'>[] }) => {
          if (!body?.rejections?.length) return;
          const at = Date.now();
          const added = body.rejections.map((r) => ({
            ...r,
            table: /\b(?:add|update|delete|manage) (\w+) in realm\b/.exec(r.message)?.[1],
            at,
          }));
          console.warn('Dexie Cloud avvisade ändringar:', added);
          syncRejections.value = [...syncRejections.value, ...added];
        })
        .catch(() => {
          // Svaret var inte JSON. Då finns inga avvisningar att visa.
        });
    }
    return response;
  };
}
