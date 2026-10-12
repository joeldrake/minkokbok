<script setup lang="ts">
import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { db, PUBLIC_REALM } from '../db';
import { useLiveQuery } from '../composables/useLiveQuery';
import { inputValue } from '../utils';

/** Så kort sökning räcker inte, så att sidan inte blir en lista över alla användare. */
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 20;
const DEBOUNCE_MS = 250;

const { t } = useI18n();
const query = ref('');
/** Söktexten som faktiskt används, uppdateras först när användaren slutat skriva en stund. */
const debouncedQuery = ref('');
const q = computed(() => debouncedQuery.value.trim().toLowerCase());

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
watch(query, (value) => {
  clearTimeout(debounceTimer);
  // För kort sökning döljer resultaten direkt, ingen anledning att vänta.
  if (value.trim().length < MIN_QUERY_LENGTH) debouncedQuery.value = value;
  else debounceTimer = setTimeout(() => (debouncedQuery.value = value), DEBOUNCE_MS);
});
onScopeDispose(() => clearTimeout(debounceTimer));

const results = useLiveQuery(
  async () => {
    if (q.value.length < MIN_QUERY_LENGTH) return [];
    const profiles = await db.profiles
      .filter((p) => p.username.includes(q.value) || p.displayName.toLowerCase().includes(q.value))
      .limit(MAX_RESULTS)
      .toArray();
    return Promise.all(
      profiles.map(async (profile) => ({
        profile,
        recipeCount: await db.recipes
          .where('owner')
          .equals(profile.owner!)
          .filter((r) => r.realmId === PUBLIC_REALM)
          .count(),
      })),
    );
  },
  () => q.value,
);

/** Senast laddade resultat, så att listan inte blinkar till medan en ny sökning laddar. */
type Result = NonNullable<typeof results.value>;
const shownResults = shallowRef<Result>();
watch(results, (value) => {
  if (value) shownResults.value = value;
});
</script>

<template>
  <div class="page-content narrow wa-stack wa-gap-xl">
    <header class="wa-stack wa-gap-s">
      <h1 class="wa-heading-2xl">{{ t('find.title') }}</h1>
      <p class="wa-body-l wa-color-text-quiet">{{ t('find.intro') }}</p>
    </header>

    <wa-input
      :placeholder="t('find.search')"
      :value="query"
      size="l"
      autofocus
      with-clear
      @input="query = inputValue($event)"
      @wa-clear="query = ''"
    >
      <wa-icon slot="start" name="magnifying-glass"></wa-icon>
    </wa-input>

    <template v-if="q.length >= MIN_QUERY_LENGTH && shownResults">
      <p v-if="shownResults.length === 0" class="wa-color-text-quiet">
        {{ t('find.noMatches', { query: debouncedQuery.trim() }) }}
      </p>
      <ul v-else class="results wa-stack wa-gap-s">
        <li v-for="{ profile, recipeCount } in shownResults" :key="profile.id">
          <RouterLink :to="{ name: 'public', params: { username: profile.username } }" class="plain-link">
            <wa-card appearance="outlined" class="result">
              <div class="wa-split wa-gap-m">
                <div class="wa-stack wa-gap-3xs">
                  <strong>{{ profile.displayName }}</strong>
                  <span class="wa-caption-m wa-color-text-quiet">@{{ profile.username }}</span>
                  <span v-if="profile.bio" class="bio wa-body-s">{{ profile.bio }}</span>
                </div>
                <span class="wa-caption-m wa-color-text-quiet">{{ t('find.recipeCount', recipeCount) }}</span>
              </div>
            </wa-card>
          </RouterLink>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.results {
  list-style: none;
  margin: 0;
  padding: 0;
}

.result {
  inline-size: 100%;
}

.bio {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
