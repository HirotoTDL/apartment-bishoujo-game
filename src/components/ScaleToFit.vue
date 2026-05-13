<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

/**
 * Scales its slot content to fit the window while preserving the design's
 * aspect ratio. The inner container is always rendered at `designWidth x
 * designHeight` and visually scaled by `transform: scale()`.
 *
 * This guarantees that no matter the window size:
 *  - All UI elements remain at the SAME proportional size
 *  - Nothing collapses or overflows
 *  - The whole UI is always visible (letterboxed if aspect ratios differ)
 */

const props = withDefaults(defineProps<{
  designWidth?: number;
  designHeight?: number;
}>(), {
  designWidth: 1280,
  designHeight: 720,
});

const scale = ref(1);

function recompute() {
  const sx = window.innerWidth / props.designWidth;
  const sy = window.innerHeight / props.designHeight;
  scale.value = Math.min(sx, sy);
  // expose as CSS var for any consumer that wants to invert/compensate
  document.documentElement.style.setProperty("--ui-scale", String(scale.value));
}

let ro: ResizeObserver | null = null;

onMounted(() => {
  recompute();
  window.addEventListener("resize", recompute);
  window.addEventListener("orientationchange", recompute);
  ro = new ResizeObserver(recompute);
  ro.observe(document.documentElement);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", recompute);
  window.removeEventListener("orientationchange", recompute);
  if (ro) ro.disconnect();
});
</script>

<template>
  <div class="scale-outer">
    <div
      class="scale-inner"
      :style="{
        width: designWidth + 'px',
        height: designHeight + 'px',
        transform: `scale(${scale})`,
      }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.scale-outer {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.scale-inner {
  flex-shrink: 0;
  position: relative;
  transform-origin: center center;
}
</style>
