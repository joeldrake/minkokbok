<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter, type RouteLocationRaw } from 'vue-router';

const props = defineProps<{
  /** Sidan knappen leder till. Utan den går knappen till föregående sida, eller `fallback`. */
  to?: string;
  /** Vart knappen leder när det inte finns någon föregående sida i appen, t.ex. från en delad länk. */
  fallback?: RouteLocationRaw;
  /** Smal som pappersarket under, så att texten linjerar med dess vänsterkant. */
  narrow?: boolean;
}>();

const { t } = useI18n();
const router = useRouter();

/** Går tillbaka i historiken när det leder rätt, så att historiken inte växer. */
function goBack() {
  const back: string | null | undefined = window.history.state?.back;
  if (props.to ? back === props.to : back) router.back();
  else router.push(props.to ?? props.fallback ?? { name: 'list' });
}
</script>

<template>
  <!-- Ligger på omslaget, ovanför sidans innehåll -->
  <nav class="page-content back-nav" :class="{ 'back-nav-narrow': narrow }">
    <wa-button class="back" appearance="plain" size="s" @click="goBack">
      <wa-icon slot="start" name="chevron-left"></wa-icon>
      {{ t('nav.back') }}
    </wa-button>
  </nav>
</template>

<style scoped>
.back-nav {
  margin-block-end: var(--wa-space-s);
}

.back-nav-narrow {
  max-inline-size: 44rem;
}

/* Knappens text i linje med innehållets vänsterkant */
.back {
  --wa-color-on-quiet: var(--mk-on-linen);
  margin-inline-start: calc(-1 * var(--wa-space-s));
}
</style>
