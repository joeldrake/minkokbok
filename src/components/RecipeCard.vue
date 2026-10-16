<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';
import type { Recipe } from '../db/types';
import { isPublic } from '../db/recipes';
import { totalMinutes } from '../utils';
import RecipeCover from './RecipeCover.vue';
import { rememberClickedCard } from '../viewTransition';

const props = defineProps<{
  recipe: Recipe & { realmId?: string };
  showPublicTag?: boolean;
  /** Kockens namn, för recept av någon annan. */
  author?: string;
  /** Vart kortet länkar. Standard är receptsidan i appen, /recept/:id. */
  to?: RouteLocationRaw;
}>();
const { t } = useI18n();

// Utan innehåll renderas ingen sidfot, så kortet inte får en tom rad längst ner.
const hasFooter = computed(
  () =>
    !!props.author ||
    totalMinutes(props.recipe) > 0 || !!props.recipe.servings || (props.showPublicTag && isPublic(props.recipe)),
);
</script>

<template>
  <RouterLink :to="to ?? { name: 'recipe', params: { id: recipe.id } }" class="plain-link card-link"
    :data-vt-recipe="recipe.id"
    @click="rememberClickedCard"
  >
    <wa-card class="recipe-card">
      <RecipeCover v-if="recipe.cover" slot="media" :cover="recipe.cover" data-vt="cover" />
      <div class="wa-stack wa-gap-xs">
        <h2 class="title wa-heading-m"><span class="title-text" data-vt="title">{{ recipe.title }}</span></h2>
        <p v-if="recipe.description" class="description wa-body-s wa-color-text-quiet">{{ recipe.description }}</p>
      </div>
      <div v-if="hasFooter" slot="footer" class="footer wa-cluster wa-gap-s wa-caption-m wa-color-text-quiet">
        <span v-if="author" class="wa-cluster wa-gap-2xs">
          <wa-icon name="user"></wa-icon>{{ author }}
        </span>
        <span v-if="totalMinutes(recipe)" class="wa-cluster wa-gap-2xs">
          <wa-icon name="clock"></wa-icon>{{ t('recipe.totalTime', { n: totalMinutes(recipe) }) }}
        </span>
        <span v-if="recipe.servings" class="wa-cluster wa-gap-2xs">
          <wa-icon name="utensils"></wa-icon>{{ t('recipe.servingsCount', { n: recipe.servings }, recipe.servings) }}
        </span>
        <wa-tag v-if="showPublicTag && isPublic(recipe)" size="s" variant="brand" appearance="filled">
          {{ t('recipe.isPublic') }}
        </wa-tag>
      </div>
    </wa-card>
  </RouterLink>
</template>

<style scoped>
.card-link {
  display: block;
  block-size: 100%;
}

.recipe-card {
  block-size: 100%;
  transition: translate var(--wa-transition-fast), box-shadow var(--wa-transition-fast);
}

.card-link:hover .recipe-card,
.card-link:focus-visible .recipe-card {
  translate: 0 calc(-1 * var(--wa-space-3xs));
  box-shadow: var(--wa-shadow-m);
}

/* Storlekarna sätts i styles/theme.css */
.title {
  font-size: var(--mk-card-title);
}

/* Lika bred som texten, så att den skalas i takt med receptsidans titel i övergången */
.title-text {
  display: inline-block;
}

.description,
.footer {
  font-size: var(--mk-card-text);
}

.description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}
</style>
