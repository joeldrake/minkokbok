<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import type { Cover } from '../db/types';
import { layoutEmojis } from '../cover/layout';

const props = defineProps<{ cover: Cover }>();

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

const items = computed(() =>
  props.cover.kind === 'emoji'
    ? layoutEmojis(props.cover).map(({ emoji, x, y, size, turn }) => ({
        emoji,
        style: { left: `${x * 100}%`, top: `${y * 100}%`, '--size': size.toFixed(2), '--turn': `${turn}deg` },
      }))
    : [],
);
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
