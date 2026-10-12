<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRegisterSW } from 'virtual:pwa-register/vue';

const { t } = useI18n();

/** En installerad app laddas sällan om, så titta efter ny version då och då. */
const UPDATE_INTERVAL = 60 * 60 * 1000;

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    setInterval(() => {
      if (navigator.onLine) registration.update();
    }, UPDATE_INTERVAL);
  },
});
</script>

<template>
  <wa-callout v-if="needRefresh" variant="brand" class="update-prompt">
    <wa-icon slot="icon" name="rotate"></wa-icon>
    <div class="wa-split wa-gap-s">
      <span>{{ t('update.available') }}</span>
      <div class="wa-cluster wa-gap-2xs">
        <wa-button size="s" appearance="plain" @click="needRefresh = false">{{ t('update.later') }}</wa-button>
        <wa-button size="s" variant="brand" @click="updateServiceWorker()">{{ t('update.reload') }}</wa-button>
      </div>
    </div>
  </wa-callout>
</template>

<style scoped>
.update-prompt {
  position: fixed;
  inset-inline: var(--wa-space-m);
  inset-block-end: calc(var(--wa-space-m) + env(safe-area-inset-bottom, 0px));
  z-index: 100;
  max-inline-size: 32rem;
  margin-inline: auto;
  box-shadow: var(--wa-shadow-l);
}
</style>
