<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <!-- En limpa som gräddas med ånga som stiger, i stället för en spinner -->
  <span class="bread-loader delayed-appear" role="status" :aria-label="t('app.loading')">
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <g class="steam" fill="none" stroke-linecap="round" stroke-width="2.5">
        <path d="M22 26 c-3 -4 3 -6 0 -10 s3 -6 0 -10" />
        <path d="M32 24 c-3 -4 3 -6 0 -10 s3 -6 0 -10" />
        <path d="M42 26 c-3 -4 3 -6 0 -10 s3 -6 0 -10" />
      </g>
      <path class="crust" d="M8 52 C8 36 18 28 32 28 S56 36 56 52 Q56 56 52 56 H12 Q8 56 8 52 Z" />
      <g class="cuts" fill="none" stroke-linecap="round" stroke-width="2.5">
        <path d="M18 42 q4 -5 8 -6" />
        <path d="M28 40 q4 -5 8 -6" />
        <path d="M38 42 q4 -5 8 -6" />
      </g>
    </svg>
  </span>
</template>

<style scoped>
.bread-loader {
  /* Centrerar sig själv, oavsett om föräldern centrerar eller inte */
  display: block;
  margin-inline: auto;
  inline-size: 4rem;
  block-size: 4rem;
  /* En bit ner på sidan i stället för tätt under rubriken */
  margin-block-start: 12vh;
}

svg {
  inline-size: 100%;
  block-size: 100%;
  overflow: visible;
}

.crust {
  fill: #e9cf9b;
  transform-origin: 32px 56px;
  animation: bake 2.4s ease-in-out infinite alternate;
}

.cuts {
  stroke: #f6e6c4;
}

.steam {
  stroke: var(--wa-color-text-quiet);
}

.steam path {
  opacity: 0;
  animation: rise 2.4s ease-out infinite;
}

.steam path:nth-child(2) {
  animation-delay: 0.8s;
}

.steam path:nth-child(3) {
  animation-delay: 1.6s;
}

/* Degen jäser lite och får färg */
@keyframes bake {
  from {
    fill: #e9cf9b;
    transform: scale(0.94, 0.88);
  }
  to {
    fill: #b8742f;
    transform: scale(1);
  }
}

@keyframes rise {
  0% {
    opacity: 0;
    transform: translateY(6px);
  }
  30% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
    transform: translateY(-8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .crust {
    animation: none;
    fill: #b8742f;
  }

  .steam path {
    animation: none;
    opacity: 0.5;
  }
}
</style>
