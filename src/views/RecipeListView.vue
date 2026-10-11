<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { db } from '../db';
import { useLiveQuery } from '../composables/useLiveQuery';
import { useCurrentUser } from '../composables/useCurrentUser';
import RecipeCard from '../components/RecipeCard.vue';
import { inputValue } from '../utils';

const { t } = useI18n();
const router = useRouter();
const { user } = useCurrentUser();
const query = ref('');

// Den publika realmen synkas till alla, så filtrera fram de egna recepten.
const recipes = useLiveQuery(
  () =>
    db.recipes
      .orderBy('updatedAt')
      .reverse()
      .filter((r) => !r.owner || r.owner === db.cloud.currentUserId)
      .toArray(),
  () => user.value?.userId,
);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q || !recipes.value) return recipes.value;
  return recipes.value.filter((r) =>
    [r.title, r.description, ...r.tags, ...r.ingredients.map((i) => i.name)].some((s) => s?.toLowerCase().includes(q)),
  );
});
</script>

<template>
  <div class="page-content wa-stack wa-gap-xl">
    <div v-if="recipes === undefined" class="wa-stack wa-align-items-center">
      <wa-spinner></wa-spinner>
    </div>

    <section v-else-if="recipes.length === 0" class="empty paper wa-stack wa-gap-l wa-align-items-center wa-text-center">
      <wa-icon name="book-open" class="empty-icon"></wa-icon>
      <h1 class="wa-heading-xl">{{ t('list.emptyTitle') }}</h1>
      <p class="wa-body-l wa-color-text-quiet">{{ t('list.emptyText') }}</p>
      <wa-button variant="brand" size="l" @click="router.push({ name: 'new' })">
        <wa-icon slot="start" name="plus"></wa-icon>
        {{ t('list.emptyAction') }}
      </wa-button>
    </section>

    <template v-else>
      <div class="wa-split wa-gap-m">
        <h1 class="wa-heading-2xl">{{ t('list.title') }}</h1>
        <wa-input
          class="search"
          :placeholder="t('list.search')"
          :value="query"
          with-clear
          @input="query = inputValue($event)"
          @wa-clear="query = ''"
        >
          <wa-icon slot="start" name="magnifying-glass"></wa-icon>
        </wa-input>
      </div>

      <p v-if="filtered?.length === 0" class="wa-color-text-quiet">{{ t('list.noMatches', { query }) }}</p>
      <div class="wa-grid wa-gap-l recipe-grid">
        <RecipeCard v-for="recipe in filtered" :key="recipe.id" :recipe="recipe" show-public-tag />
      </div>

      <div class="wa-cluster wa-justify-content-center">
        <wa-button variant="brand" @click="router.push({ name: 'new' })">
          <wa-icon slot="start" name="plus"></wa-icon>
          {{ t('nav.newRecipe') }}
        </wa-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.empty {
  max-inline-size: 36rem;
  margin-inline: auto;
  padding-block: var(--wa-space-3xl);
}

.empty-icon {
  font-size: var(--wa-font-size-5xl);
  color: var(--wa-color-brand-fill-loud);
}

.search {
  inline-size: 20rem;
  max-inline-size: 100%;
}

.recipe-grid {
  --min-column-size: 16rem;
}
</style>
