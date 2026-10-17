<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Cover, EmojiCover, Ingredient } from '../db/types';
import { MAX_COVER_EMOJIS, parseEmojis } from '../cover/emoji';
import { suggestEmojisWithAi } from '../cover/aiEmojis';
import { useCurrentUser } from '../composables/useCurrentUser';
import { prepareCoverImage } from '../cover/image';
import { PALETTES } from '../theme/palette';
import { inputValue } from '../utils';
import RecipeCover from './RecipeCover.vue';

const props = defineProps<{
  suggestions: string[];
  /** Det AI:n får se när den föreslår emojis. */
  recipe: { title: string; description: string; ingredients: Ingredient[] };
}>();
const cover = defineModel<Cover | undefined>();
const { t } = useI18n();
// AI-förslag kostar per anrop, så de är till för member och admin (samma som får publicera).
const { user, canPublish } = useCurrentUser();

function newSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

const emojiCover = computed(() => (cover.value?.kind === 'emoji' ? cover.value : undefined));

// Texten i fältet hålls separat så att markören inte hoppar medan man skriver.
// Den skrivs bara om när emojierna ändras på annat sätt, t.ex. via ett förslag.
const text = ref('');
watch(
  () => emojiCover.value?.emojis,
  (emojis) => {
    if (!emojis) text.value = '';
    else if (parseEmojis(text.value).join() !== emojis.join()) text.value = emojis.join(' ');
  },
  { immediate: true },
);

const unusedSuggestions = computed(() => props.suggestions.filter((e) => !emojiCover.value?.emojis.includes(e)));
const full = computed(() => (emojiCover.value?.emojis.length ?? 0) >= MAX_COVER_EMOJIS);

const fileInput = ref<HTMLInputElement>();
const processing = ref(false);
const imageError = ref(false);

async function onFileChange() {
  const file = fileInput.value?.files?.[0];
  if (!file) return;
  processing.value = true;
  imageError.value = false;
  try {
    cover.value = { kind: 'photo', image: await prepareCoverImage(file) };
  } catch (error) {
    console.error('Kunde inte läsa bilden', error);
    imageError.value = true;
  } finally {
    processing.value = false;
    // Töm fältet så att samma fil kan väljas igen
    if (fileInput.value) fileInput.value.value = '';
  }
}

function createEmojiCover() {
  cover.value = {
    kind: 'emoji',
    emojis: props.suggestions.slice(0, 4),
    palette: PALETTES[Math.floor(Math.random() * PALETTES.length)],
    seed: newSeed(),
  };
}

function update(changes: Partial<EmojiCover>) {
  if (emojiCover.value) cover.value = { ...emojiCover.value, ...changes };
}

function onInput(event: Event) {
  text.value = inputValue(event);
  update({ emojis: parseEmojis(text.value) });
}

const aiLoading = ref(false);
const aiError = ref(false);

async function suggestWithAi() {
  aiLoading.value = true;
  aiError.value = false;
  try {
    const emojis = await suggestEmojisWithAi(props.recipe, user.value?.accessToken);
    update({ emojis });
  } catch (error) {
    console.error('Kunde inte hämta emojiförslag', error);
    aiError.value = true;
  } finally {
    aiLoading.value = false;
  }
}

function add(emoji: string) {
  if (emojiCover.value && !full.value) update({ emojis: [...emojiCover.value.emojis, emoji] });
}
</script>

<template>
  <fieldset class="cover-editor wa-stack wa-gap-s">
    <legend class="wa-heading-m">{{ t('cover.title') }}</legend>

    <!-- accept="image/*" ger kamerarullen och kameran som val på mobilen -->
    <input ref="fileInput" type="file" accept="image/*" class="file-input" @change="onFileChange" />

    <p v-if="!cover" class="wa-body-s wa-color-text-quiet">{{ t('cover.intro') }}</p>
    <RecipeCover v-else :cover="cover" class="preview" />

    <wa-callout v-if="imageError" variant="danger" size="s">{{ t('cover.imageError') }}</wa-callout>

    <template v-if="emojiCover">
      <wa-input
        :label="t('cover.emojis')"
        :hint="t('cover.emojisHint', { max: MAX_COVER_EMOJIS })"
        :value="text"
        @input="onInput"
      ></wa-input>

      <div v-if="unusedSuggestions.length" class="wa-stack wa-gap-2xs">
        <span class="wa-caption-m wa-color-text-quiet">{{ t('cover.suggestions') }}</span>
        <div class="wa-cluster wa-gap-2xs">
          <wa-button
            v-for="emoji in unusedSuggestions"
            :key="emoji"
            class="suggestion"
            size="s"
            appearance="outlined"
            pill
            :disabled="full"
            :title="t('cover.add', { emoji })"
            @click="add(emoji)"
          >
            {{ emoji }}
          </wa-button>
        </div>
      </div>

      <div class="wa-stack wa-gap-2xs">
        <span class="wa-caption-m wa-color-text-quiet">{{ t('cover.color') }}</span>
        <div class="wa-cluster wa-gap-xs">
          <label v-for="p in PALETTES" :key="p" class="swatch" :data-palette="p" :title="t(`appearance.palettes.${p}`)">
            <input
              type="radio"
              name="cover-palette"
              class="wa-visually-hidden-force"
              :value="p"
              :checked="emojiCover.palette === p"
              @change="update({ palette: p })"
            />
            <span class="wa-visually-hidden">{{ t(`appearance.palettes.${p}`) }}</span>
          </label>
        </div>
      </div>
    </template>

    <wa-callout v-if="aiError" variant="danger" size="s">{{ t('cover.aiError') }}</wa-callout>

    <div class="wa-cluster wa-gap-s">
      <wa-button
        :size="cover ? 's' : 'm'"
        appearance="outlined"
        :loading="processing"
        @click="fileInput?.click()"
      >
        <wa-icon slot="start" name="image"></wa-icon>
        {{ cover?.kind === 'photo' ? t('cover.replaceImage') : t('cover.uploadImage') }}
      </wa-button>
      <wa-button v-if="!emojiCover" :size="cover ? 's' : 'm'" appearance="outlined" @click="createEmojiCover">
        <wa-icon slot="start" name="wand-magic-sparkles"></wa-icon>
        {{ t('cover.create') }}
      </wa-button>
      <wa-button v-if="emojiCover" size="s" appearance="outlined" @click="update({ seed: newSeed() })">
        <wa-icon slot="start" name="shuffle"></wa-icon>
        {{ t('cover.shuffle') }}
      </wa-button>
      <wa-button
        v-if="emojiCover && canPublish"
        size="s"
        appearance="outlined"
        :loading="aiLoading"
        :disabled="!recipe.title.trim()"
        @click="suggestWithAi"
      >
        <wa-icon slot="start" name="wand-magic-sparkles"></wa-icon>
        {{ t('cover.aiSuggest') }}
      </wa-button>
      <wa-button v-if="cover" size="s" appearance="plain" @click="cover = undefined">
        <wa-icon slot="start" name="xmark"></wa-icon>
        {{ t('cover.remove') }}
      </wa-button>
    </div>
  </fieldset>
</template>

<style scoped>
.cover-editor {
  border: none;
  padding: 0;
  margin: 0;
}

.cover-editor legend {
  padding: 0;
  margin-block-end: var(--wa-space-xs);
}

/* Väljs via knappen "Ladda upp bild" */
.file-input {
  display: none;
}

.cover-editor p {
  margin: 0;
}

.preview {
  border-radius: var(--wa-border-radius-l);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08);
}

.suggestion {
  font-size: 1.25rem;
}

.swatch {
  display: block;
  inline-size: 2rem;
  block-size: 2rem;
  border-radius: var(--wa-border-radius-circle);
  background: var(--mk-cloth);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
  outline: 3px solid transparent;
  outline-offset: 2px;
  cursor: pointer;
  transition: outline-color var(--wa-transition-fast);
}

.swatch:hover {
  outline-color: var(--wa-color-surface-border);
}

.swatch:has(input:checked) {
  outline-color: var(--wa-color-brand-50);
}

.swatch:has(input:focus-visible) {
  outline-color: var(--wa-color-focus);
}
</style>
