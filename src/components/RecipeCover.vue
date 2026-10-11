<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import type { Cover } from '../db/types';

const props = defineProps<{ cover: Cover }>();

const COLUMNS = 6;
const ROWS = 3;

/** Liten deterministisk slumpgenerator (mulberry32), så samma seed ger samma omslag. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// En Blob kan inte visas direkt, så den får en tillfällig URL som släpps när bilden byts ut.
const photoUrl = ref<string>();
watchEffect((onCleanup) => {
  const image = props.cover.kind === 'photo' ? props.cover.image : undefined;
  // Saknas bilden, t.ex. för att den inte hunnit synkas hit, visas bara bakgrunden
  if (!(image instanceof Blob)) {
    photoUrl.value = undefined;
    return;
  }
  const url = URL.createObjectURL(image);
  photoUrl.value = url;
  onCleanup(() => URL.revokeObjectURL(url));
});

/** Emojis utspridda i ett förskjutet rutnät med lite slumpad plats, storlek och vinkel. */
const items = computed(() => {
  if (props.cover.kind !== 'emoji') return [];
  const { emojis, seed } = props.cover;
  if (emojis.length === 0) return [];
  const rand = random(seed);
  const result: { emoji: string; style: Record<string, string> }[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      // Varannan rad förskjuts ett halvt steg, som ett tegelmönster
      const x = (col + (row % 2) * 0.5 + 0.25 + rand() * 0.5) / COLUMNS;
      const y = (row + 0.25 + rand() * 0.5) / ROWS;
      let index = Math.floor(rand() * emojis.length);
      // Undvik samma emoji två gånger i rad
      if (emojis.length > 1 && result.at(-1)?.emoji === emojis[index]) index = (index + 1) % emojis.length;
      result.push({
        emoji: emojis[index],
        style: {
          left: `${x * 100}%`,
          top: `${y * 100}%`,
          '--size': (0.75 + rand() * 0.6).toFixed(2),
          '--turn': `${Math.round(rand() * 50 - 25)}deg`,
        },
      });
    }
  }
  return result;
});
</script>

<template>
  <div
    class="cover"
    :class="cover.kind"
    :data-palette="cover.kind === 'emoji' ? cover.palette : undefined"
    aria-hidden="true"
  >
    <img v-if="photoUrl" :src="photoUrl" alt="" class="image" />
    <span v-for="(item, i) in items" :key="i" :style="item.style">{{ item.emoji }}</span>
  </div>
</template>

<style scoped>
.cover {
  position: relative;
  overflow: hidden;
  container-type: inline-size;
  aspect-ratio: 2 / 1;
}

.emoji {
  background: var(--mk-weave), var(--mk-cloth);
  background-blend-mode: soft-light, soft-light, soft-light, normal;
}

.photo {
  background: var(--wa-color-surface-lowered);
}

.image {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
}

.emoji > span {
  position: absolute;
  font-size: calc(var(--size) * 8.5cqi);
  line-height: 1;
  translate: -50% -50%;
  rotate: var(--turn);
  filter: drop-shadow(0 0.04em 0.05em rgb(0 0 0 / 0.25));
  user-select: none;
}
</style>
