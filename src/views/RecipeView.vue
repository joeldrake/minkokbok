<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { db } from '../db';
import type { Ingredient } from '../db/types';
import { useLiveQuery } from '../composables/useLiveQuery';

const props = defineProps<{ id: string }>();
const { t } = useI18n();
const router = useRouter();

const recipe = useLiveQuery(
  async () => (await db.recipes.get(props.id)) ?? null,
  () => props.id,
);

const isOwner = computed(() => {
  const owner = recipe.value?.owner;
  return !owner || owner === db.cloud.currentUserId;
});

/** Ingredienser grupperade efter rubrik, i ursprunglig ordning. */
const ingredientGroups = computed(() => {
  const groups: { name?: string; items: Ingredient[] }[] = [];
  for (const ingredient of recipe.value?.ingredients ?? []) {
    const last = groups.at(-1);
    if (last && last.name === ingredient.group) last.items.push(ingredient);
    else groups.push({ name: ingredient.group, items: [ingredient] });
  }
  return groups;
});
</script>

<template>
  <div class="page-content narrow recipe-paper">
    <div v-if="recipe === undefined" class="wa-stack wa-align-items-center">
      <wa-spinner></wa-spinner>
    </div>

    <section v-else-if="recipe === null" class="wa-stack wa-gap-m wa-align-items-center wa-text-center">
      <wa-icon name="magnifying-glass" class="big-icon"></wa-icon>
      <h1 class="wa-heading-xl">{{ t('recipe.notFound') }}</h1>
      <p class="wa-color-text-quiet">{{ t('recipe.notFoundText') }}</p>
      <wa-button @click="router.push({ name: 'list' })">{{ t('recipe.backToList') }}</wa-button>
    </section>

    <article v-else class="wa-stack wa-gap-xl">
      <header class="wa-stack wa-gap-m">
        <div class="title-row">
          <h1 class="wa-heading-3xl">{{ recipe.title }}</h1>
          <wa-button
            v-if="isOwner"
            class="edit-button"
            appearance="plain"
            size="s"
            @click="router.push({ name: 'edit', params: { id } })"
          >
            <wa-icon name="pen" :label="t('recipe.edit')"></wa-icon>
          </wa-button>
        </div>
        <p v-if="recipe.description" class="wa-body-l wa-color-text-quiet lead">{{ recipe.description }}</p>
        <div class="wa-cluster wa-gap-xs">
          <wa-tag v-if="recipe.prepMinutes" appearance="filled" size="s">
            <wa-icon name="clock"></wa-icon>&nbsp;{{ t('recipe.prepShort', { n: recipe.prepMinutes }) }}
          </wa-tag>
          <wa-tag v-if="recipe.cookMinutes" appearance="filled" size="s">
            <wa-icon name="fire"></wa-icon>&nbsp;{{ t('recipe.cookShort', { n: recipe.cookMinutes }) }}
          </wa-tag>
          <wa-tag v-if="recipe.servings" appearance="filled" size="s">
            <wa-icon name="utensils"></wa-icon>&nbsp;{{ t('recipe.servingsCount', { n: recipe.servings }, recipe.servings) }}
          </wa-tag>
          <wa-tag v-for="tag in recipe.tags" :key="tag" variant="brand" appearance="filled" size="s">{{ tag }}</wa-tag>
        </div>
      </header>

      <div class="recipe-body">
        <section class="wa-stack wa-gap-m">
          <h2 class="wa-heading-l">{{ t('recipe.ingredients') }}</h2>
          <div v-for="(group, gi) in ingredientGroups" :key="gi" class="wa-stack wa-gap-xs">
            <h3 v-if="group.name" class="wa-heading-s">{{ group.name }}</h3>
            <ul class="ingredients">
              <li v-for="(ingredient, ii) in group.items" :key="ii">
                <span class="amount">{{ [ingredient.amount, ingredient.unit].filter(Boolean).join(' ') }}</span>
                <span>
                  {{ ingredient.name }}<span v-if="ingredient.note" class="wa-color-text-quiet">, {{ ingredient.note }}</span>
                </span>
              </li>
            </ul>
          </div>
        </section>

        <section class="wa-stack wa-gap-m">
          <h2 class="wa-heading-l">{{ t('recipe.steps') }}</h2>
          <ol class="steps wa-stack wa-gap-l">
            <li v-for="(step, si) in recipe.steps" :key="si">{{ step.text }}</li>
          </ol>
        </section>
      </div>

      <p v-if="recipe.source?.url" class="wa-caption-m wa-color-text-quiet">
        {{ t('recipe.source') }}: <a :href="recipe.source.url" target="_blank" rel="noopener">{{ recipe.source.url }}</a>
      </p>
    </article>
  </div>
</template>

<style scoped>
/* Långa ord (t.ex. en titel) scrollar inuti pappret i stället för att spräcka sidan */
.recipe-paper {
  overflow-x: auto;
}

.big-icon {
  font-size: var(--wa-font-size-4xl);
  color: var(--wa-color-text-quiet);
}

.title-row {
  display: flex;
  align-items: flex-start;
  gap: var(--wa-space-s);
}

.title-row h1 {
  flex: 1;
}

.edit-button {
  color: var(--wa-color-text-quiet);
  opacity: 0.6;
  transition: opacity var(--wa-transition-fast, 150ms);
}

.edit-button:hover,
.edit-button:focus-within {
  opacity: 1;
}

.lead {
  margin: 0;
}

.recipe-body {
  display: grid;
  gap: var(--wa-space-2xl);
}

@media (width >= 48rem) {
  .recipe-body {
    grid-template-columns: minmax(14rem, 1fr) 2fr;
    align-items: start;
  }
}

.ingredients,
.steps {
  font-family: var(--mk-font-serif);
  font-size: 1.0625rem;
}

.ingredients {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ingredients li {
  display: grid;
  grid-template-columns: 5.5em 1fr;
  gap: var(--wa-space-s);
  padding-block: var(--wa-space-xs);
  border-block-end: var(--wa-border-width-s) dashed var(--wa-color-surface-border);
}

.amount {
  font-weight: var(--wa-font-weight-bold);
  font-variant-numeric: tabular-nums;
}

.steps {
  counter-reset: step;
  list-style: none;
  padding: 0;
  margin: 0;
}

.steps li {
  counter-increment: step;
  display: grid;
  grid-template-columns: 2.25em 1fr;
  gap: var(--wa-space-m);
  line-height: var(--wa-line-height-expanded);
  white-space: pre-line;
}

.steps li::before {
  content: counter(step);
  display: grid;
  place-items: center;
  block-size: 2.25em;
  border-radius: var(--wa-border-radius-circle);
  background: var(--wa-color-brand-fill-quiet);
  color: var(--wa-color-brand-on-quiet);
  font-family: var(--wa-font-family-heading);
  font-weight: var(--wa-font-weight-bold);
}
</style>
