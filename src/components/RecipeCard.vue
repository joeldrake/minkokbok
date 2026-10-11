<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Recipe } from '../db/types';
import { isPublic } from '../db/recipes';
import { totalMinutes } from '../utils';

defineProps<{ recipe: Recipe & { realmId?: string }; showPublicTag?: boolean }>();
const { t } = useI18n();
</script>

<template>
  <RouterLink :to="{ name: 'recipe', params: { id: recipe.id } }" class="plain-link card-link">
    <wa-card class="recipe-card">
      <div class="wa-stack wa-gap-xs">
        <h2 class="wa-heading-m">{{ recipe.title }}</h2>
        <p v-if="recipe.description" class="description wa-body-s wa-color-text-quiet">{{ recipe.description }}</p>
      </div>
      <div slot="footer" class="wa-cluster wa-gap-s wa-caption-m wa-color-text-quiet">
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

.description {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}
</style>
