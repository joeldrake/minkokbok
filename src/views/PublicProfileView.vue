<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { db, PUBLIC_REALM } from '../db';
import { useLiveQuery } from '../composables/useLiveQuery';
import RecipeCard from '../components/RecipeCard.vue';

const props = defineProps<{ username: string }>();
const { t } = useI18n();

const data = useLiveQuery(
  async () => {
    const profile = await db.profiles.where('username').equals(props.username.toLowerCase()).first();
    if (!profile) return null;
    const recipes = await db.recipes
      .where('owner')
      .equals(profile.owner)
      .filter((r) => r.realmId === PUBLIC_REALM)
      .sortBy('title');
    return { profile, recipes };
  },
  () => props.username,
);
</script>

<template>
  <div class="page-content wa-stack wa-gap-xl">
    <div v-if="data === undefined" class="wa-stack wa-align-items-center">
      <wa-spinner></wa-spinner>
    </div>

    <p v-else-if="data === null" class="wa-text-center wa-color-text-quiet">
      {{ t('public.notFound', { username }) }}
    </p>

    <template v-else>
      <header class="wa-stack wa-gap-s">
        <h1 class="wa-heading-2xl">{{ t('public.recipesBy', { name: data.profile.displayName }) }}</h1>
        <p v-if="data.profile.bio" class="wa-body-l wa-color-text-quiet">{{ data.profile.bio }}</p>
      </header>
      <p v-if="data.recipes.length === 0" class="wa-color-text-quiet">
        {{ t('public.empty', { name: data.profile.displayName }) }}
      </p>
      <div class="wa-grid wa-gap-l recipe-grid">
        <RecipeCard v-for="recipe in data.recipes" :key="recipe.id" :recipe="recipe" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.recipe-grid {
  /* auto-fill i stället för wa-grids auto-fit, så att ett ensamt kort inte fyller hela raden */
  grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr));
}
</style>
