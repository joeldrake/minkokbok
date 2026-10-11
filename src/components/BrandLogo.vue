<script setup lang="ts">
import { logoSvg } from '../theme/logo';

// Färgerna följer vald palett via CSS-variabler.
const svg = logoSvg({ cover: 'var(--mk-logo-cover)', spine: 'var(--mk-logo-spine)', band: 'var(--mk-logo-band)' });
</script>

<template>
  <span class="brand-logo" aria-hidden="true" v-html="svg"></span>
</template>

<style scoped>
.brand-logo {
  display: inline-block;
  line-height: 0;
}

.brand-logo :deep(svg) {
  inline-size: 100%;
  block-size: 100%;
}
</style>
