import { computed, shallowRef } from 'vue';
import type { UserLogin } from 'dexie-cloud-addon';
import { db, PUBLIC_REALM, ROLES, type Role } from '../db';
import { useLiveQuery } from './useLiveQuery';

// En delad prenumeration för hela appen.
const user = shallowRef<UserLogin>(db.cloud.currentUser.value);
db.cloud.currentUser.subscribe((u) => (user.value = u));

export function useCurrentUser() {
  const isLoggedIn = computed(() => Boolean(user.value?.isLoggedIn));
  /** Sant tills Dexie Cloud har läst in den sparade inloggningen. Användaren är då okänd, inte utloggad. */
  const isLoading = computed(() => Boolean(user.value?.isLoading));
  const profile = useLiveQuery(
    () => (user.value?.isLoggedIn ? db.profiles.where('owner').equals(user.value.userId!).first() : undefined),
    () => user.value?.userId,
  );
  /** Användarens roller i den publika realmen. */
  const roles = useLiveQuery(
    async () => {
      const userId = user.value?.userId;
      if (!user.value?.isLoggedIn || !userId) return [];
      // Precis som servern räknas bara accepterade medlemskap; övriga är obesvarade inbjudningar.
      const members = await db.members
        .filter((m) => m.realmId === PUBLIC_REALM && m.userId === userId && Boolean(m.accepted) && !m.rejected)
        .toArray();
      return members.flatMap((m) => m.roles ?? []) as Role[];
    },
    () => user.value?.userId,
  );
  const isAdmin = computed(() => Boolean(roles.value?.includes(ROLES.admin)));
  /** Member och Admin får publicera recept och profil i rlm-public. */
  const canPublish = computed(() => isAdmin.value || Boolean(roles.value?.includes(ROLES.member)));
  return { user, isLoggedIn, isLoading, profile, roles, isAdmin, canPublish };
}
