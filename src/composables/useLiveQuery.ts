import { liveQuery, type Subscription } from 'dexie';
import { onScopeDispose, shallowRef, watch, type Ref } from 'vue';

/**
 * Reaktiv Dexie-fråga. Värdet är `undefined` medan frågan laddar och uppdateras
 * automatiskt när datan ändras, även när ändringen kommer via synk från en annan enhet.
 * Frågan körs om när `deps` ändras.
 */
export function useLiveQuery<T>(
  querier: () => T | Promise<T>,
  deps: () => unknown = () => null,
): Readonly<Ref<T | undefined>> {
  const result = shallowRef<T>();
  let subscription: Subscription | undefined;

  watch(
    deps,
    () => {
      subscription?.unsubscribe();
      result.value = undefined;
      subscription = liveQuery(querier).subscribe({
        next: (value) => (result.value = value),
        error: (error) => console.error(error),
      });
    },
    { immediate: true },
  );

  onScopeDispose(() => subscription?.unsubscribe());
  return result;
}
