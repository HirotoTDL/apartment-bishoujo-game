<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{
  variant?: "cosmic" | "fire" | "water" | "wood" | "light" | "dark" | "rose";
  intensity?: "low" | "normal" | "high";
}>(), {
  variant: "cosmic",
  intensity: "normal",
});

const baseGradient = computed(() => {
  switch (props.variant) {
    case "fire": return "linear-gradient(135deg,#1a0808 0%,#3d1410 50%,#5a1a0a 100%)";
    case "water": return "linear-gradient(135deg,#08101a 0%,#10243d 50%,#0a325a 100%)";
    case "wood": return "linear-gradient(135deg,#0a1a08 0%,#103d14 50%,#0a5a1a 100%)";
    case "light": return "linear-gradient(135deg,#1a1a08 0%,#3d3514 50%,#5a4a0a 100%)";
    case "dark": return "linear-gradient(135deg,#0a081a 0%,#241038 50%,#1a0832 100%)";
    case "rose": return "linear-gradient(135deg,#2a0a1a 0%,#5a0a3a 35%,#3a0a5a 70%,#1a0a2a 100%)";
    default: return "linear-gradient(135deg,#0a0518 0%,#15082b 50%,#1a0a3a 100%)";
  }
});

const blobsCount = computed(() => props.intensity === "low" ? 3 : props.intensity === "high" ? 8 : 5);
const blobs = computed(() =>
  Array.from({ length: blobsCount.value }, (_, i) => ({
    id: i,
    x: 5 + (i * 137) % 90,
    y: 5 + (i * 251) % 90,
    size: 200 + (i * 73) % 280,
    hue: (220 + i * 47) % 360,
    delay: i * 1.7,
    dur: 14 + (i % 3) * 3,
  }))
);
</script>

<template>
  <div class="abg fixed inset-0 -z-10 overflow-hidden" :style="{ background: baseGradient }">
    <!-- Animated nebula blobs -->
    <div
      v-for="b in blobs"
      :key="b.id"
      class="abg-blob"
      :style="{
        left: b.x + '%',
        top: b.y + '%',
        width: b.size + 'px',
        height: b.size + 'px',
        background: `radial-gradient(circle, hsla(${b.hue}, 80%, 55%, 0.4) 0%, transparent 65%)`,
        animationDelay: `-${b.delay}s`,
        animationDuration: `${b.dur}s`,
      }"
    />
    <!-- Twinkling stars -->
    <div class="abg-particles" />
    <div class="abg-particles abg-particles--alt" />
    <!-- Grid overlay -->
    <div class="abg-grid" />
  </div>
</template>

<style scoped>
.abg-blob {
  position: absolute;
  border-radius: 9999px;
  filter: blur(40px);
  mix-blend-mode: screen;
  animation: drift 18s ease-in-out infinite alternate;
  transform: translate(-50%, -50%);
}
@keyframes drift {
  0% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(calc(-50% + 60px), calc(-50% - 40px)) scale(1.15); }
  100% { transform: translate(calc(-50% - 40px), calc(-50% + 50px)) scale(0.9); }
}

.abg-particles {
  position: absolute;
  inset: -10%;
  background-image:
    radial-gradient(1.5px 1.5px at 18% 22%, rgba(255,255,255,0.85), transparent 50%),
    radial-gradient(1px 1px at 65% 45%, rgba(255,210,210,0.6), transparent 50%),
    radial-gradient(2px 2px at 35% 75%, rgba(210,210,255,0.55), transparent 50%),
    radial-gradient(1px 1px at 85% 15%, rgba(255,230,255,0.65), transparent 50%),
    radial-gradient(1.5px 1.5px at 50% 90%, rgba(255,255,210,0.55), transparent 50%),
    radial-gradient(2px 2px at 90% 70%, rgba(220,255,250,0.5), transparent 50%);
  background-size: 480px 480px;
  animation: twinkle-bg 14s ease-in-out infinite;
  opacity: 0.85;
}
.abg-particles--alt {
  background-size: 720px 720px;
  animation-duration: 22s;
  animation-direction: reverse;
  opacity: 0.55;
}
@keyframes twinkle-bg {
  0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.75; }
  50% { transform: translate(20px, -25px) scale(1.05); opacity: 1; }
}

.abg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
}
</style>
