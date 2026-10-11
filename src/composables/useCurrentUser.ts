import { computed, shallowRef } from 'vue';
import type { UserLogin } from 'dexie-cloud-addon';
import { db } from '../db';
import { useLiveQuery } from './useLiveQuery';

// En delad prenumeration för hela appen.
const user = shallowRef<UserLogin>(db.cloud.currentUser.value);
db.cloud.currentUser.subscribe((u) => (user.value = u));

export function useCurrentUser() {
  const isLoggedIn = computed(() => Boolean(user.value?.isLoggedIn));
  const profile = useLiveQuery(
    () => (user.value?.isLoggedIn ? db.profiles.where('owner').equals(user.value.userId!).first() : undefined),
    () => user.value?.userId,
  );
  return { user, isLoggedIn, profile };
}
