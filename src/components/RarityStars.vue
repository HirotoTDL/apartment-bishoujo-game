<script setup lang="ts">
import { computed } from "vue";
import type { Rarity } from "../game/data/characters";
import Icon from "./Icon.vue";

const props = defineProps<{
  rarity: Rarity;
  size?: number;
}>();

const config = computed(() => {
  const map: Record<Rarity, { count: number; color: string }> = {
    N:   { count: 1, color: "#cbd5e1" },
    R:   { count: 2, color: "#60a5fa" },
    SR:  { count: 3, color: "#c084fc" },
    SSR: { count: 4, color: "#fbbf24" },
    UR:  { count: 5, color: "#fca5a5" },
  };
  return map[props.rarity];
});
</script>

<template>
  <div class="stars flex gap-0.5" :style="{ color: config.color }">
    <span v-for="i in config.count" :key="i" class="star-wrap">
      <Icon name="star" :size="size || 14" />
    </span>
  </div>
</template>

<style scoped>
.star-wrap {
  filter: drop-shadow(0 0 4px currentColor);
}
</style>
