<script setup lang="ts">
import { onMounted, ref } from "vue";

const props = withDefaults(defineProps<{
  value: number;
  kind?: "physical" | "fire" | "water" | "wood" | "light" | "dark" | "heal";
  isCritical?: boolean;
  x?: number;
  y?: number;
}>(), {
  kind: "physical",
  isCritical: false,
  x: 50,
  y: 50,
});

const visible = ref(true);
onMounted(() => {
  setTimeout(() => { visible.value = false; }, 1500);
});

const sign = props.kind === "heal" ? "+" : "";
const displayValue = `${sign}${Math.abs(props.value)}`;
</script>

<template>
  <span
    v-if="visible"
    class="damage-popup"
    :class="[
      `damage-popup-${kind}`,
      isCritical ? 'text-5xl' : 'text-3xl',
    ]"
    :style="{ left: x + '%', top: y + '%', transform: 'translate(-50%, -50%)' }"
  >
    {{ displayValue }}<span v-if="isCritical" class="text-yellow-300 ml-1 text-2xl">!!</span>
  </span>
</template>
