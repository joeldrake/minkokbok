<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { cloudEnabled, db } from '../db';
import type { Ingredient } from '../db/types';
import { formatShoppingList } from '../db/parse';
import { findPublicRecipe, isPublic } from '../db/recipes';
import { useLiveQuery } from '../composables/useLiveQuery';
import { useCurrentUser } from '../composables/useCurrentUser';
import { bookmark, removeBookmark } from '../db/social';
import { recipeOrigin } from '../navigation';
import RecipeCover from '../components/RecipeCover.vue';
import BackButton from '../components/BackButton.vue';
import BreadLoader from '../components/BreadLoader.vue';

/** Antingen /recept/:id, eller den publika adressen /:username/:slug. */
const props = defineProps<{ id?: string; username?: string; slug?: string }>();
const { t } = useI18n();
const router = useRouter();
const { isLoggedIn } = useCurrentUser();

const data = useLiveQuery(
  async () => {
    if (props.id) {
      const recipe = await db.recipes.get(props.id);
      const profile = recipe?.owner ? await db.profiles.where('owner').equals(recipe.owner).first() : undefined;
      return recipe ? { recipe, profile } : null;
    }
    if (!props.username || !props.slug) return null;
    const profile = await db.profiles.where('username').equals(props.username.toLowerCase()).first();
    const recipe = profile && (await findPublicRecipe(profile.owner!, props.slug));
    return recipe ? { recipe, profile } : null;
  },
  () => [props.id, props.username, props.slug],
);
const recipe = computed(() => (data.value === undefined ? undefined : (data.value?.recipe ?? null)));

/** Den publika adressen, som går att dela med vem som helst. */
const publicUrl = computed(() => {
  const value = data.value;
  if (!value?.profile || !value.recipe.slug || !isPublic(value.recipe)) return undefined;
  return `${location.origin}/${value.profile.username}/${value.recipe.slug}`;
});

// En gammal slug (titeln har ändrats sedan länken delades) byts mot den aktuella.
watch(data, (value) => {
  if (props.slug && value?.recipe.slug && value.recipe.slug !== props.slug) {
    router.replace({ name: 'publicRecipe', params: { username: value.profile!.username, slug: value.recipe.slug } });
  }
});

watch(recipe, (value) => {
  document.title = value ? `${value.title} – Min Kokbok` : 'Min Kokbok';
});

/**
 * Vart tillbaka-knappen leder: listan eller profilsidan man kom ifrån, annars författarens
 * profilsida för ett publicerat recept och startsidan för ett opublicerat.
 * Medan receptet laddas, utan sida man kom ifrån, går knappen tillbaka i historiken.
 */
const parent = computed(() => {
  if (recipeOrigin.value) return recipeOrigin.value.fullPath;
  const value = data.value;
  if (!value) return undefined;
  if (isPublic(value.recipe) && value.profile) {
    return router.resolve({ name: 'public', params: { username: value.profile.username } }).href;
  }
  return router.resolve({ name: 'list' }).href;
});

const isOwner = computed(() => {
  const owner = recipe.value?.owner;
  return !owner || owner === db.cloud.currentUserId;
});

const isBookmarked = useLiveQuery(
  async () => (recipe.value ? (await db.bookmarks.where('recipeId').equals(recipe.value.id).count()) > 0 : false),
  () => recipe.value?.id,
);

/**
 * En annan kocks publika recept, som man kan spara till fliken "Andras recept".
 * Bara inloggad: utloggad går det inte att avgöra om receptet är ens eget.
 * Ett eget recept som ändå blivit sparat får knappen, så att bokmärket går att ta bort.
 */
const canBookmark = computed(
  () =>
    cloudEnabled &&
    isLoggedIn.value &&
    (!isOwner.value || Boolean(isBookmarked.value)) &&
    Boolean(recipe.value && isPublic(recipe.value)),
);

function toggleBookmark() {
  if (!recipe.value) return;
  if (isBookmarked.value) removeBookmark(recipe.value.id);
  else bookmark(recipe.value.id);
}

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

const shoppingList = computed(() => formatShoppingList(recipe.value?.ingredients ?? []));
</script>

<template>
  <!-- Visas redan medan receptet laddas, så att sidan inte hoppar när det kommer -->
  <BackButton v-if="recipe !== null" :to="parent" narrow class="recipe-width" />
  <div class="page-content narrow recipe-paper recipe-width" :class="{ loading: recipe === undefined }">
    <div v-if="recipe === undefined" class="wa-stack wa-align-items-center">
      <BreadLoader />
    </div>

    <section v-else-if="recipe === null" class="wa-stack wa-gap-m wa-align-items-center wa-text-center">
      <wa-icon name="magnifying-glass" class="big-icon"></wa-icon>
      <h1 class="wa-heading-xl">{{ t('recipe.notFound') }}</h1>
      <p class="wa-color-text-quiet">{{ t('recipe.notFoundText') }}</p>
      <wa-button @click="router.push({ name: 'list' })">{{ t('recipe.backToList') }}</wa-button>
    </section>

    <article v-else class="wa-stack wa-gap-xl">
      <header class="wa-stack wa-gap-m">
        <RecipeCover v-if="recipe.cover" :cover="recipe.cover" class="cover" />
        <div class="title-row">
          <h1 class="title wa-heading-3xl">{{ recipe.title }}</h1>
          <div v-if="publicUrl || isOwner || canBookmark" class="title-actions">
            <wa-button
              v-if="canBookmark"
              :class="{ 'quiet-button': !isBookmarked }"
              appearance="plain"
              size="s"
              :title="isBookmarked ? t('recipe.bookmarked') : t('recipe.bookmark')"
              @click="toggleBookmark"
            >
              <wa-icon
                name="bookmark"
                :variant="isBookmarked ? 'solid' : 'regular'"
                :label="isBookmarked ? t('recipe.bookmarked') : t('recipe.bookmark')"
              ></wa-icon>
            </wa-button>
            <wa-copy-button
              v-if="publicUrl"
              class="quiet-button"
              :value="publicUrl"
              :copy-label="t('recipe.copyLink')"
              :success-label="t('recipe.linkCopied')"
            ></wa-copy-button>
            <wa-button
              v-if="isOwner"
              class="quiet-button"
              appearance="plain"
              size="s"
              @click="router.push({ name: 'edit', params: { id: recipe.id } })"
            >
              <wa-icon name="pen" :label="t('recipe.edit')"></wa-icon>
            </wa-button>
          </div>
        </div>
        <p v-if="!isOwner && data?.profile" class="wa-body-m wa-color-text-quiet lead">
          {{ t('recipe.by') }}
          <RouterLink :to="{ name: 'public', params: { username: data.profile.username } }">{{ data.profile.displayName }}</RouterLink>
        </p>
        <p v-if="recipe.description" class="wa-body-l wa-color-text-quiet lead">{{ recipe.description }}</p>
        <div
          v-if="recipe.prepMinutes || recipe.cookMinutes || recipe.servings || recipe.tags.length"
          class="wa-cluster wa-gap-xs"
        >
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
          <div class="section-heading">
            <h2 class="wa-heading-l">{{ t('recipe.ingredients') }}</h2>
            <wa-copy-button
              v-if="shoppingList"
              class="quiet-button"
              :value="shoppingList"
              :copy-label="t('recipe.copyIngredients')"
              :success-label="t('recipe.ingredientsCopied')"
            ></wa-copy-button>
          </div>
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

      <p v-if="recipe.source?.url" class="source wa-caption-m wa-color-text-quiet">
        {{ t('recipe.source') }}: <a :href="recipe.source.url" target="_blank" rel="noopener">{{ recipe.source.url }}</a>
      </p>
    </article>
  </div>
</template>

<style scoped>
/* Receptet får ett bredare pappersark än formulären, och tillbaka-knappen följer med */
.page-content.recipe-width {
  max-inline-size: var(--mk-sheet-width);
}

/* Långa ord (t.ex. en titel) scrollar inuti pappret i stället för att spräcka sidan */
.recipe-paper {
  overflow-x: auto;
}

/* Arket är lika högt som ett recept brukar vara redan innan det laddats */
.recipe-paper.loading {
  min-block-size: var(--mk-sheet-loading-height);
}

.big-icon {
  font-size: var(--wa-font-size-4xl);
  color: var(--wa-color-text-quiet);
}

/*
 * Titeln tar den plats som finns och knapparna står kvar till höger, centrerade mot första
 * raden. På mobil avstavas långa ord (sidan har lang="sv") i stället för att trycka ut knapparna.
 */
.title-row {
  --title-size: var(--wa-font-size-3xl);
  display: flex;
  align-items: flex-start;
  gap: var(--wa-space-2xs);
}

.title {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: var(--title-size);
  overflow-wrap: break-word;
  text-wrap: pretty;
}

/* Lika hög som titelns första rad, så att knapparna hamnar mitt för den */
.title-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  block-size: calc(var(--title-size) * var(--wa-line-height-condensed));
}

@media (width < 40rem) {
  .title-row {
    --title-size: var(--wa-font-size-2xl);
  }

  .title {
    hyphens: auto;
    /* Minst fyra tecken på var sida om bindestrecket, så att det inte blir "saff-" */
    hyphenate-limit-chars: 8 4 4;
    -webkit-hyphenate-limit-before: 4;
    -webkit-hyphenate-limit-after: 4;
  }
}

@media (width < 22.5rem) {
  .title-row {
    --title-size: var(--wa-font-size-xl);
  }
}

.quiet-button {
  color: var(--wa-color-text-quiet);
  opacity: 0.6;
  transition: opacity var(--wa-transition-fast, 150ms);
}

.quiet-button:hover,
.quiet-button:focus-within {
  opacity: 1;
}

.cover {
  border-radius: var(--wa-border-radius-l);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08);
}

.lead {
  margin: 0;
}

/* Långa käll-URL:er radbryts var som helst i stället för att sidoscrolla */
.source {
  overflow-wrap: anywhere;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--wa-space-2xs);
}

.section-heading h2 {
  margin: 0;
}

.recipe-body {
  display: grid;
  gap: var(--wa-space-2xl);
}

/*
 * Ingredienskolumnen är minst 14rem men växer om ett långt ord kräver det, så att den aldrig
 * flödar över in i "Gör så här". Golvet ligger på listan och inte på kolumnen eller sektionen:
 * minmax(14rem, …) eller min-inline-size på sektionen ersätter innehållsminimumet och låser bredden.
 */
@media (width >= 48rem) {
  .recipe-body {
    grid-template-columns: 1fr 2fr;
    align-items: start;
  }

  .ingredients {
    min-inline-size: 14rem;
  }
}

.ingredients,
.steps {
  font-family: var(--mk-font-serif);
  font-size: var(--mk-recipe-text);
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
