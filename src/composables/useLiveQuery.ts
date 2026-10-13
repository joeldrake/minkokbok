import { liveQuery, type Subscription } from 'dexie';
import { onScopeDispose, shallowRef, watch, type Ref } from 'vue';
import { dbOpenCount } from '../db';

/**
 * Reaktiv Dexie-fråga. Värdet är `undefined` medan frågan laddar och uppdateras
 * automatiskt när datan ändras, även när ändringen kommer via synk från en annan enhet.
 * Frågan körs om när `deps` ändras, och när databasen öppnats igen efter att frågan misslyckats.
 */
export function useLiveQuery<T>(
  querier: () => T | Promise<T>,
  deps: () => unknown = () => null,
): Readonly<Ref<T | undefined>> {
  const result = shallowRef<T>();
  let subscription: Subscription | undefined;
  let failed = false;

  function subscribe() {
    subscription?.unsubscribe();
    result.value = undefined;
    failed = false;
    subscription = liveQuery(querier).subscribe({
      next: (value) => (result.value = value),
      error: (error) => {
        console.error(error);
        failed = true;
      },
    });
  }

  watch(deps, subscribe, { immediate: true });
  watch(dbOpenCount, () => {
    if (failed) subscribe();
  });

  onScopeDispose(() => subscription?.unsubscribe());
  return result;
}
