<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { cloudEnabled, db } from '../db';
import {
  createRecipe,
  deleteRecipe,
  isPublic,
  setRecipePublic,
  updateRecipe,
  type RecipeDraft,
} from '../db/recipes';
import { formatIngredients, formatSteps, parseIngredients, parseSteps } from '../db/parse';
import { inputValue } from '../utils';
import { useLiveQuery } from '../composables/useLiveQuery';
import { useCurrentUser } from '../composables/useCurrentUser';

const props = defineProps<{ id?: string }>();
const { t } = useI18n();
const router = useRouter();
const { isLoggedIn, profile, canPublish } = useCurrentUser();

// Publik-läget sparas direkt, oberoende av formuläret, så det läses live.
const recipe = useLiveQuery(
  async () => (props.id ? ((await db.recipes.get(props.id)) ?? null) : null),
  () => props.id,
);
const publicUrl = computed(() => (profile.value ? `${location.host}/${profile.value.username}` : ''));
const confirmDelete = ref(false);

// Formuläret redigerar text. Den tolkas till strukturerad data när man sparar.
const form = reactive({
  title: '',
  description: '',
  servings: '',
  prepMinutes: '',
  cookMinutes: '',
  ingredients: '',
  steps: '',
  tags: '',
  sourceUrl: '',
});
const loaded = ref(!props.id);
const saving = ref(false);

watch(
  () => props.id,
  async (id) => {
    if (!id) return;
    const recipe = await db.recipes.get(id);
    if (recipe) {
      Object.assign(form, {
        title: recipe.title,
        description: recipe.description ?? '',
        servings: recipe.servings?.toString() ?? '',
        prepMinutes: recipe.prepMinutes?.toString() ?? '',
        cookMinutes: recipe.cookMinutes?.toString() ?? '',
        ingredients: formatIngredients(recipe.ingredients),
        steps: formatSteps(recipe.steps),
        tags: recipe.tags.join(', '),
        sourceUrl: recipe.source?.url ?? '',
      });
    }
    loaded.value = true;
  },
  { immediate: true },
);

function toNumber(value: string): number | undefined {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

async function onPublicChange(event: Event) {
  if (!props.id) return;
  await setRecipePublic(props.id, (event.target as HTMLInputElement).checked);
}

async function onDelete() {
  if (!props.id) return;
  confirmDelete.value = false;
  await deleteRecipe(props.id);
  router.replace({ name: 'list' });
}

async function onSubmit() {
  if (!form.title.trim()) return;
  saving.value = true;
  const draft: RecipeDraft = {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    servings: toNumber(form.servings),
    prepMinutes: toNumber(form.prepMinutes),
    cookMinutes: toNumber(form.cookMinutes),
    ingredients: parseIngredients(form.ingredients),
    steps: parseSteps(form.steps),
    tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
    source: form.sourceUrl.trim() ? { kind: 'url', url: form.sourceUrl.trim() } : { kind: 'manual' },
  };
  try {
    const id = props.id ?? (await createRecipe(draft));
    if (props.id) await updateRecipe(props.id, draft);
    router.replace({ name: 'recipe', params: { id } });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="page-content narrow">
    <form v-if="loaded" class="wa-stack wa-gap-l" @submit.prevent="onSubmit">
      <div class="wa-split wa-gap-m">
        <h1 class="wa-heading-2xl">{{ id ? t('recipe.editTitle') : t('recipe.newTitle') }}</h1>
        <wa-button v-if="!id" appearance="plain" size="s" @click="router.push({ name: 'import' })">
          <wa-icon slot="start" name="file-import"></wa-icon>
          {{ t('recipe.importAction') }}
        </wa-button>
      </div>

      <wa-input
        :label="t('recipe.title')"
        :placeholder="t('recipe.titlePlaceholder')"
        :value="form.title"
        required
        autofocus
        @input="form.title = inputValue($event)"
      ></wa-input>

      <wa-textarea
        :label="t('recipe.description')"
        :placeholder="t('recipe.descriptionPlaceholder')"
        :value="form.description"
        rows="2"
        resize="auto"
        @input="form.description = inputValue($event)"
      ></wa-textarea>

      <div class="wa-grid wa-gap-m numbers">
        <wa-input
          type="number"
          inputmode="numeric"
          min="1"
          :label="t('recipe.servings')"
          :value="form.servings"
          @input="form.servings = inputValue($event)"
        ></wa-input>
        <wa-input
          type="number"
          inputmode="numeric"
          min="0"
          :label="t('recipe.prepMinutes')"
          :value="form.prepMinutes"
          @input="form.prepMinutes = inputValue($event)"
        ></wa-input>
        <wa-input
          type="number"
          inputmode="numeric"
          min="0"
          :label="t('recipe.cookMinutes')"
          :value="form.cookMinutes"
          @input="form.cookMinutes = inputValue($event)"
        ></wa-input>
      </div>

      <wa-textarea
        :label="t('recipe.ingredients')"
        :hint="t('recipe.ingredientsHint')"
        :value="form.ingredients"
        rows="8"
        resize="auto"
        @input="form.ingredients = inputValue($event)"
      ></wa-textarea>

      <wa-textarea
        :label="t('recipe.steps')"
        :hint="t('recipe.stepsHint')"
        :value="form.steps"
        rows="8"
        resize="auto"
        @input="form.steps = inputValue($event)"
      ></wa-textarea>

      <wa-input
        :label="t('recipe.tags')"
        :hint="t('recipe.tagsHint')"
        :value="form.tags"
        @input="form.tags = inputValue($event)"
      ></wa-input>

      <wa-input
        type="url"
        :label="t('recipe.sourceUrl')"
        :value="form.sourceUrl"
        @input="form.sourceUrl = inputValue($event)"
      ></wa-input>

      <wa-card v-if="recipe && cloudEnabled" appearance="filled">
        <wa-switch
          :checked="isPublic(recipe)"
          :disabled="!isLoggedIn || !canPublish || !profile"
          @change="onPublicChange"
        >
          {{ t('recipe.public') }}
          <span slot="hint">
            <template v-if="!isLoggedIn">{{ t('recipe.publicNeedsLogin') }}</template>
            <template v-else-if="!canPublish">{{ t('recipe.publicNeedsRole') }}</template>
            <template v-else-if="!profile">
              <RouterLink :to="{ name: 'profile' }">{{ t('recipe.publicNeedsProfile') }}</RouterLink>
            </template>
            <template v-else>{{ t('recipe.publicHint', { url: publicUrl }) }}</template>
          </span>
        </wa-switch>
      </wa-card>

      <div class="wa-split wa-gap-s">
        <div class="wa-cluster wa-gap-s">
          <wa-button type="submit" variant="brand" :loading="saving">{{ t('recipe.save') }}</wa-button>
          <wa-button appearance="plain" @click="router.back()">{{ t('recipe.cancel') }}</wa-button>
        </div>
        <wa-button v-if="id" appearance="plain" variant="danger" @click="confirmDelete = true">
          <wa-icon slot="start" name="trash"></wa-icon>
          {{ t('recipe.delete') }}
        </wa-button>
      </div>
    </form>

    <wa-dialog
      :label="t('recipe.deleteConfirmTitle')"
      :open="confirmDelete"
      @wa-after-hide="confirmDelete = false"
    >
      {{ t('recipe.deleteConfirmText', { title: form.title }) }}
      <div slot="footer" class="wa-cluster wa-gap-s">
        <wa-button appearance="plain" @click="confirmDelete = false">{{ t('recipe.cancel') }}</wa-button>
        <wa-button variant="danger" @click="onDelete">{{ t('recipe.delete') }}</wa-button>
      </div>
    </wa-dialog>
  </div>
</template>

<style scoped>
.numbers {
  --min-column-size: 10rem;
}
</style>
