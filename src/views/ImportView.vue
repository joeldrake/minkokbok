<script setup lang="ts">
import { computed, ref, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { db } from '../db';
import { createRecipe, type RecipeDraft } from '../db/recipes';
import { parseMarkdownRecipe } from '../db/importMarkdown';

type ItemStatus = 'ready' | 'duplicate' | 'error' | 'imported';

interface ImportItem {
  fileName: string;
  status: ItemStatus;
  draft?: RecipeDraft;
  error?: string;
}

const { t } = useI18n();
const router = useRouter();
const fileInput = ref<HTMLInputElement>();
const items = ref<ImportItem[]>([]);
const dragging = ref(false);
const importing = ref(false);

const ready = computed(() => items.value.filter((i) => i.status === 'ready'));
const importedCount = computed(() => items.value.filter((i) => i.status === 'imported').length);

const ERROR_KEYS: Record<string, string> = {
  'not-a-recipe': 'import.errorNotRecipe',
  'missing-title': 'import.errorMissingTitle',
};

async function addFiles(files: File[]) {
  const own = await db.recipes.filter((r) => !r.owner || r.owner === db.cloud.currentUserId).toArray();
  const titles = new Set(own.map((r) => r.title.toLowerCase()));
  for (const item of items.value) if (item.draft) titles.add(item.draft.title.toLowerCase());

  for (const file of files) {
    if (!/\.(md|markdown)$/i.test(file.name)) continue;
    const item: ImportItem = { fileName: file.name, status: 'ready' };
    try {
      item.draft = parseMarkdownRecipe(await file.text());
      const key = item.draft.title.toLowerCase();
      if (titles.has(key)) item.status = 'duplicate';
      titles.add(key);
    } catch (e) {
      item.status = 'error';
      item.error = t(ERROR_KEYS[(e as Error).message] ?? 'import.errorUnknown');
    }
    items.value.push(item);
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  // Kopiera innan input töms, FileList är levande.
  addFiles(Array.from(input.files ?? []));
  input.value = '';
}

function onDrop(event: DragEvent) {
  dragging.value = false;
  addFiles(Array.from(event.dataTransfer?.files ?? []));
}

async function onImport() {
  importing.value = true;
  try {
    for (const item of ready.value) {
      // IndexedDB kan inte spara Vues reaktiva proxyobjekt.
      await createRecipe(toRaw(item.draft!));
      item.status = 'imported';
    }
  } finally {
    importing.value = false;
  }
}

function summary(draft: RecipeDraft): string {
  return [
    t('import.ingredientCount', draft.ingredients.length),
    t('import.stepCount', draft.steps.length),
    ...draft.tags,
  ].join(' · ');
}

const STATUS_VARIANT: Record<ItemStatus, string> = {
  ready: 'brand',
  duplicate: 'warning',
  error: 'danger',
  imported: 'success',
};
</script>

<template>
  <div class="page-content narrow wa-stack wa-gap-l">
    <h1 class="wa-heading-2xl">{{ t('import.title') }}</h1>
    <p class="wa-color-text-quiet">{{ t('import.intro') }}</p>

    <div
      class="dropzone wa-stack wa-gap-s wa-align-items-center wa-text-center"
      :class="{ dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <wa-icon name="file-arrow-up" class="dropzone-icon"></wa-icon>
      <p>{{ t('import.dropHint') }}</p>
      <wa-button appearance="outlined" @click="fileInput?.click()">{{ t('import.chooseFiles') }}</wa-button>
      <input ref="fileInput" type="file" accept=".md,.markdown,text/markdown" multiple class="file-input" @change="onFileChange" />
    </div>

    <template v-if="items.length">
      <ul class="items wa-stack wa-gap-s">
        <li v-for="(item, index) in items" :key="index" class="item wa-split wa-gap-m">
          <div class="wa-stack wa-gap-3xs">
            <strong>{{ item.draft?.title ?? item.fileName }}</strong>
            <span class="wa-caption-m wa-color-text-quiet">
              {{ item.draft ? summary(item.draft) : item.error }}
            </span>
          </div>
          <wa-tag size="s" :variant="STATUS_VARIANT[item.status]" appearance="filled-outlined">
            {{ t(`import.status.${item.status}`) }}
          </wa-tag>
        </li>
      </ul>

      <wa-callout v-if="importedCount && !ready.length" variant="success" size="s">
        <wa-icon slot="icon" name="circle-check"></wa-icon>
        {{ t('import.done', importedCount) }}
      </wa-callout>

      <div class="wa-cluster wa-gap-s">
        <wa-button variant="brand" :disabled="!ready.length" :loading="importing" @click="onImport">
          {{ t('import.importButton', ready.length) }}
        </wa-button>
        <wa-button appearance="plain" @click="router.push({ name: 'list' })">{{ t('import.toList') }}</wa-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dropzone {
  padding: var(--wa-space-2xl) var(--wa-space-l);
  border: var(--wa-border-width-m) dashed var(--wa-color-neutral-border-normal);
  border-radius: var(--wa-border-radius-l);
  transition: background-color var(--wa-transition-fast);
}

.dropzone.dragging {
  border-color: var(--wa-color-brand-border-loud);
  background: var(--wa-color-brand-fill-quiet);
}

.dropzone-icon {
  font-size: var(--wa-font-size-3xl);
  color: var(--wa-color-brand-fill-loud);
}

.file-input {
  display: none;
}

.items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item {
  padding: var(--wa-space-s) var(--wa-space-m);
  border: var(--wa-border-width-s) solid var(--wa-color-surface-border);
  border-radius: var(--wa-border-radius-m);
}
</style>
