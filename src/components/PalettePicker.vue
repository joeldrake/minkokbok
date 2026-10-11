<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { palette, PALETTES, setPalette } from '../theme/palette';
import { setTextSize, textSize } from '../theme/textSize';
import BrandLogo from './BrandLogo.vue';

const { t } = useI18n();
</script>

<template>
  <fieldset class="picker wa-stack wa-gap-s">
    <legend class="wa-heading-m">{{ t('appearance.title') }}</legend>
    <p class="hint wa-body-s wa-color-text-quiet">{{ t('appearance.hint') }}</p>
    <div class="options">
      <!-- data-palette ger varje färgprov sin egen palett, se theme.css -->
      <label v-for="p in PALETTES" :key="p" class="option" :data-palette="p">
        <input
          type="radio"
          name="palette"
          class="wa-visually-hidden-force"
          :value="p"
          :checked="palette === p"
          @change="setPalette(p)"
        />
        <span class="swatch"><BrandLogo class="swatch-logo" /></span>
        <span class="name wa-body-s">{{ t(`appearance.palettes.${p}`) }}</span>
      </label>
    </div>
    <wa-switch
      class="text-size"
      :checked="textSize === 'large'"
      @change="setTextSize(($event.target as HTMLInputElement).checked ? 'large' : 'normal')"
    >
      {{ t('appearance.largeText') }}
      <span slot="hint">{{ t('appearance.largeTextHint') }}</span>
    </wa-switch>
  </fieldset>
</template>

<style scoped>
.picker {
  border: none;
  padding: 0;
  margin: 0;
}

.picker legend {
  padding: 0;
  margin-block-end: var(--wa-space-xs);
}

.hint {
  margin: 0;
}

.text-size {
  margin-block-start: var(--wa-space-m);
}

.options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  gap: var(--wa-space-m);
}

.option {
  display: grid;
  justify-items: center;
  gap: var(--wa-space-xs);
  cursor: pointer;
}

.swatch {
  display: grid;
  place-items: center;
  inline-size: 100%;
  aspect-ratio: 4 / 3;
  border-radius: var(--wa-border-radius-m);
  background: var(--mk-weave), var(--mk-cloth);
  background-blend-mode: soft-light, soft-light, soft-light, normal;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.08);
  outline: 3px solid transparent;
  outline-offset: 3px;
  transition: outline-color var(--wa-transition-fast);
}

.swatch-logo {
  inline-size: 2.75rem;
  block-size: 2.75rem;
  filter: drop-shadow(0 1px 1px rgb(0 0 0 / 0.25));
}

.option:hover .swatch {
  outline-color: var(--wa-color-surface-border);
}

.option:has(input:checked) .swatch {
  outline-color: var(--wa-color-brand-50);
}

.option:has(input:focus-visible) .swatch {
  outline-color: var(--wa-color-focus);
}

.option:has(input:checked) .name {
  font-weight: var(--wa-font-weight-bold);
}
</style>
