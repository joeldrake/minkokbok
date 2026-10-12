<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { cloudEnabled, db } from '../db';
import type { Recipe } from '../db/types';
import { useLiveQuery } from '../composables/useLiveQuery';
import { useCurrentUser } from '../composables/useCurrentUser';
import { isPublic, publicRecipeRoute } from '../db/recipes';
import RecipeCard from '../components/RecipeCard.vue';
import { inputValue } from '../utils';

/** Så många av de senaste recepten från kockar man följer visas. */
const LATEST_COUNT = 6;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { user, profile, isLoggedIn } = useCurrentUser();
const query = ref('');

/** Följningar och bokmärken hör till kontot, så "Andras recept" finns bara för inloggade. */
const showTabs = computed(() => cloudEnabled && isLoggedIn.value);
/** Fliken står i adressen (?visa=andra), så att tillbaka från ett recept hamnar på rätt flik. */
const tab = computed(() => (showTabs.value && route.query.visa === 'andra' ? 'others' : 'mine'));

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

/** Kockar man följer, deras senaste recept och recept man sparat med bokmärket. */
const others = useLiveQuery(
  async () => {
    const followees = (await db.follows.toArray()).map((f) => f.followee);
    const bookmarks = (await db.bookmarks.toArray()).sort((a, b) => b.createdAt - a.createdAt);
    // Ett sparat recept som tagits bort eller gjorts privat finns inte längre här och hoppas över.
    const saved = (await db.recipes.bulkGet(bookmarks.map((b) => b.recipeId))).flatMap((r) =>
      r && isPublic(r) ? [r] : [],
    );
    const latest = followees.length
      ? (await db.recipes.where('owner').anyOf(followees).filter(isPublic).toArray())
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, LATEST_COUNT)
      : [];
    const owners = [...new Set([...followees, ...saved.map((r) => r.owner!)])];
    const profiles = new Map((await db.profiles.where('owner').anyOf(owners).toArray()).map((p) => [p.owner!, p]));
    const cooks = followees
      .flatMap((id) => profiles.get(id) ?? [])
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'sv'));
    return { cooks, latest, saved, profiles };
  },
  () => user.value?.userId,
);

function matches(recipe: Recipe, q: string) {
  return [recipe.title, recipe.description, ...recipe.tags, ...recipe.ingredients.map((i) => i.name)].some((s) =>
    s?.toLowerCase().includes(q),
  );
}

const q = computed(() => query.value.trim().toLowerCase());
const filtered = computed(() => (q.value ? recipes.value?.filter((r) => matches(r, q.value)) : recipes.value));
const filteredLatest = computed(() => others.value?.latest.filter((r) => !q.value || matches(r, q.value)) ?? []);
const filteredSaved = computed(() => others.value?.saved.filter((r) => !q.value || matches(r, q.value)) ?? []);

const showSearch = computed(() =>
  tab.value === 'mine' ? Boolean(recipes.value?.length) : Boolean(others.value?.latest.length || others.value?.saved.length),
);

/** Det som visas på välkomstsidan. Import och delning kräver inloggning, alltså molnet. */
const features = [
  { key: 'write', icon: 'pen-to-square' },
  ...(cloudEnabled
    ? [
        { key: 'import', icon: 'wand-magic-sparkles' },
        { key: 'share', icon: 'users' },
      ]
    : []),
];

function authorOf(recipe: { owner?: string }) {
  return recipe.owner ? others.value?.profiles.get(recipe.owner) : undefined;
}
</script>

<template>
  <div class="page-content wa-stack wa-gap-xl">
    <!-- Utloggad utan recept är raden tom; utan den hamnar välkomstrutan högst upp -->
    <div v-if="showTabs || showSearch || recipes?.length" class="wa-split wa-gap-m">
      <div class="wa-cluster wa-gap-s">
        <!-- Även på fliken Andras recept, så att flikarna inte hoppar i sidled när man byter -->
        <wa-button
          v-if="recipes?.length"
          variant="brand"
          pill
          :title="t('nav.newRecipe')"
          @click="router.push({ name: 'new' })"
        >
          <wa-icon name="plus" :label="t('nav.newRecipe')"></wa-icon>
        </wa-button>
        <template v-if="showTabs">
          <h1 class="wa-visually-hidden">{{ tab === 'mine' ? t('list.title') : t('list.othersTitle') }}</h1>
          <nav class="tabs wa-cluster wa-gap-l">
            <RouterLink :to="{ name: 'list' }" replace class="tab" :aria-current="tab === 'mine' ? 'page' : undefined">
              {{ t('list.title') }}
            </RouterLink>
            <RouterLink
              :to="{ name: 'list', query: { visa: 'andra' } }"
              replace
              class="tab"
              :aria-current="tab === 'others' ? 'page' : undefined"
            >
              {{ t('list.othersTitle') }}
            </RouterLink>
          </nav>
        </template>
        <!-- Utan recept tar välkomstrutan över, och en rubrik för en tom lista säger inget -->
        <h1 v-else-if="recipes?.length" class="wa-heading-2xl">{{ t('list.title') }}</h1>
      </div>
      <wa-input
        v-if="showSearch"
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

    <template v-if="tab === 'mine'">
      <div v-if="recipes === undefined" class="wa-stack wa-align-items-center">
        <wa-spinner></wa-spinner>
      </div>

      <section v-else-if="recipes.length === 0" class="welcome paper wa-stack wa-gap-2xl">
        <div class="wa-stack wa-gap-m wa-align-items-center wa-text-center">
          <wa-icon name="book-open" class="welcome-icon"></wa-icon>
          <h2 class="wa-heading-2xl">{{ t('list.emptyTitle') }}</h2>
          <p class="lede wa-body-l wa-color-text-quiet">{{ t('list.emptyText') }}</p>
          <div class="wa-cluster wa-gap-s wa-justify-content-center">
            <wa-button variant="brand" size="l" pill @click="router.push({ name: 'new' })">
              <wa-icon slot="start" name="plus"></wa-icon>
              {{ t('list.emptyAction') }}
            </wa-button>
            <wa-button appearance="outlined" size="l" pill @click="router.push({ name: 'import' })">
              <wa-icon slot="start" name="file-import"></wa-icon>
              {{ t('list.emptyImport') }}
            </wa-button>
          </div>
        </div>

        <ul class="features wa-grid wa-gap-l">
          <li v-for="feature in features" :key="feature.key" class="wa-stack wa-gap-xs">
            <wa-icon :name="feature.icon" class="feature-icon"></wa-icon>
            <h3 class="wa-heading-m">{{ t(`list.emptyFeatures.${feature.key}.title`) }}</h3>
            <p class="wa-color-text-quiet">{{ t(`list.emptyFeatures.${feature.key}.text`) }}</p>
          </li>
        </ul>
      </section>

      <template v-else>
        <p v-if="filtered?.length === 0" class="wa-color-text-quiet">{{ t('list.noMatches', { query }) }}</p>
        <div class="wa-grid wa-gap-l recipe-grid">
          <RecipeCard
            v-for="recipe in filtered"
            :key="recipe.id"
            :recipe="recipe"
            :to="publicRecipeRoute(recipe, profile?.username)"
            show-public-tag
          />
        </div>
      </template>
    </template>

    <template v-else>
      <div v-if="others === undefined" class="wa-stack wa-align-items-center">
        <wa-spinner></wa-spinner>
      </div>

      <template v-else>
        <section class="wa-stack wa-gap-m">
          <h2 class="on-linen wa-heading-l">{{ t('list.following') }}</h2>
          <div v-if="others.cooks.length" class="wa-cluster wa-gap-xs">
            <RouterLink
              v-for="cook in others.cooks"
              :key="cook.id"
              :to="{ name: 'public', params: { username: cook.username } }"
              class="plain-link"
            >
              <wa-tag appearance="filled" pill>{{ cook.displayName }}</wa-tag>
            </RouterLink>
            <wa-button appearance="plain" size="s" class="on-linen" @click="router.push({ name: 'find' })">
              <wa-icon slot="start" name="magnifying-glass"></wa-icon>
              {{ t('nav.find') }}
            </wa-button>
          </div>
          <div v-else class="hint paper wa-split wa-gap-m">
            <span>{{ t('list.followingEmpty') }}</span>
            <wa-button variant="brand" size="s" @click="router.push({ name: 'find' })">
              <wa-icon slot="start" name="magnifying-glass"></wa-icon>
              {{ t('nav.find') }}
            </wa-button>
          </div>
        </section>

        <section v-if="filteredLatest.length" class="wa-stack wa-gap-m">
          <h2 class="on-linen wa-heading-l">{{ t('list.latest') }}</h2>
          <div class="wa-grid wa-gap-l recipe-grid">
            <RecipeCard
              v-for="recipe in filteredLatest"
              :key="recipe.id"
              :recipe="recipe"
              :to="publicRecipeRoute(recipe, authorOf(recipe)?.username)"
              :author="authorOf(recipe)?.displayName"
            />
          </div>
        </section>

        <section class="wa-stack wa-gap-m">
          <h2 class="on-linen wa-heading-l">{{ t('list.saved') }}</h2>
          <p v-if="others.saved.length === 0" class="hint paper">{{ t('list.savedEmpty') }}</p>
          <p v-else-if="filteredSaved.length === 0" class="on-linen">{{ t('list.noMatches', { query }) }}</p>
          <div class="wa-grid wa-gap-l recipe-grid">
            <RecipeCard
              v-for="recipe in filteredSaved"
              :key="recipe.id"
              :recipe="recipe"
              :to="publicRecipeRoute(recipe, authorOf(recipe)?.username)"
              :author="authorOf(recipe)?.displayName"
            />
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.welcome {
  max-inline-size: 52rem;
  margin-inline: auto;
}

.welcome-icon {
  font-size: var(--wa-font-size-5xl);
  color: var(--wa-color-brand-fill-loud);
}

.welcome h2,
.welcome h3,
.welcome p {
  margin: 0;
}

.lede {
  max-inline-size: 36rem;
  text-wrap: pretty;
}

.features {
  --min-column-size: 13rem;
  list-style: none;
  margin: 0;
  padding: var(--wa-space-xl) 0 0;
  border-block-start: 1px solid var(--mk-paper-edge);
}

.feature-icon {
  font-size: var(--wa-font-size-xl);
  color: var(--wa-color-brand-fill-loud);
}

.search {
  inline-size: 20rem;
  max-inline-size: 100%;
}

.recipe-grid {
  /* auto-fill i stället för wa-grids auto-fit, så att ett ensamt kort inte fyller hela raden */
  grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr));
}

/* Flikarna ser ut som rubriker; den valda är tydlig och understruken */
.tab {
  font-family: var(--wa-font-family-heading);
  font-size: var(--wa-font-size-2xl);
  font-weight: var(--wa-font-weight-bold);
  color: var(--mk-on-linen-quiet);
  text-decoration: none;
  padding-block-end: var(--wa-space-3xs);
  border-block-end: 3px solid transparent;
}

.tab:hover {
  color: var(--mk-on-linen);
}

.tab[aria-current='page'] {
  color: var(--mk-on-linen);
  border-block-end-color: currentColor;
}

@media (width < 30rem) {
  .tab {
    font-size: var(--wa-font-size-xl);
  }
}

/* Text som ligger direkt på omslaget, utanför pappret */
.on-linen {
  color: var(--mk-on-linen);
  --wa-color-on-quiet: var(--mk-on-linen);
}

.hint {
  margin: 0;
  padding: var(--wa-space-l);
}
</style>
