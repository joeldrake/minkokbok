<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { cloudEnabled, db, PUBLIC_REALM } from '../db';
import { useLiveQuery } from '../composables/useLiveQuery';
import { useCurrentUser } from '../composables/useCurrentUser';
import { publicRecipeRoute } from '../db/recipes';
import { follow, unfollow } from '../db/social';
import RecipeCard from '../components/RecipeCard.vue';

const props = defineProps<{ username: string }>();
const { t } = useI18n();
const { user } = useCurrentUser();

const data = useLiveQuery(
  async () => {
    const profile = await db.profiles.where('username').equals(props.username.toLowerCase()).first();
    if (!profile) return null;
    const recipes = await db.recipes
      .where('owner')
      .equals(profile.owner)
      .filter((r) => r.realmId === PUBLIC_REALM)
      .sortBy('title');
    const following = (await db.follows.where('followee').equals(profile.owner!).count()) > 0;
    return { profile, recipes, following };
  },
  () => [props.username, user.value?.userId],
);

const isOwnProfile = computed(() => data.value?.profile.owner === user.value?.userId);

function toggleFollow() {
  const value = data.value;
  if (!value) return;
  if (value.following) unfollow(value.profile.owner!);
  else follow(value.profile.owner!);
}
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
        <div class="wa-split wa-gap-m">
          <h1 class="wa-heading-2xl">{{ t('public.recipesBy', { name: data.profile.displayName }) }}</h1>
          <wa-button
            v-if="cloudEnabled && !isOwnProfile"
            :variant="data.following ? 'neutral' : 'brand'"
            :appearance="data.following ? 'outlined' : 'accent'"
            size="s"
            @click="toggleFollow"
          >
            <wa-icon slot="start" :name="data.following ? 'check' : 'plus'"></wa-icon>
            {{ data.following ? t('public.following') : t('public.follow') }}
          </wa-button>
        </div>
        <p v-if="data.profile.bio" class="wa-body-l wa-color-text-quiet">{{ data.profile.bio }}</p>
      </header>
      <p v-if="data.recipes.length === 0" class="wa-color-text-quiet">
        {{ t('public.empty', { name: data.profile.displayName }) }}
      </p>
      <div class="wa-grid wa-gap-l recipe-grid">
        <RecipeCard
          v-for="recipe in data.recipes"
          :key="recipe.id"
          :recipe="recipe"
          :to="publicRecipeRoute(recipe, data.profile.username)"
        />
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
