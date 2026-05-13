<script setup lang="ts">
import { computed } from "vue";
import type { Rarity } from "../game/data/characters";

const props = withDefaults(defineProps<{
  rarity: Rarity;
  interactive?: boolean;
}>(), {
  interactive: true,
});

const frameClass = computed(() => `rf-${props.rarity}`);
</script>

<template>
  <div class="rarity-frame relative" :class="[frameClass, interactive && 'rf-hover']">
    <div class="rf-inner">
      <slot />
    </div>
    <div v-if="['SSR', 'UR'].includes(rarity)" class="rf-shimmer pointer-events-none" />
    <div v-if="rarity === 'UR'" class="rf-corners pointer-events-none">
      <span /><span /><span /><span />
    </div>
  </div>
</template>

<style scoped>
.rarity-frame {
  --frame-color: #6b7280;
  --frame-glow: rgba(156, 163, 175, 0.4);
  --frame-bg: linear-gradient(135deg, rgba(31, 41, 55, 0.85), rgba(17, 24, 39, 0.85));
  border-radius: 1rem;
  padding: 2px;
  background: var(--frame-bg);
  box-shadow: 0 0 0 1.5px var(--frame-color), 0 0 16px var(--frame-glow), 0 4px 16px rgba(0,0,0,0.4);
  transition: all 0.25s ease;
  overflow: hidden;
  isolation: isolate;
}
.rf-inner {
  position: relative;
  background: linear-gradient(135deg, rgba(20, 14, 38, 0.92), rgba(28, 18, 50, 0.92));
  border-radius: 0.875rem;
  overflow: hidden;
}
.rf-hover:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 0 0 2px var(--frame-color), 0 0 28px var(--frame-glow), 0 8px 22px rgba(0,0,0,0.5);
}

.rf-N  { --frame-color: #94a3b8; --frame-glow: rgba(148,163,184,0.35); }
.rf-R  {
  --frame-color: #60a5fa; --frame-glow: rgba(96,165,250,0.55);
  background: linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%);
}
.rf-SR {
  --frame-color: #c084fc; --frame-glow: rgba(192,132,252,0.7);
  background: linear-gradient(135deg, #6d28d9 0%, #1e1b4b 100%);
}
.rf-SSR {
  --frame-color: #fbbf24; --frame-glow: rgba(251,191,36,0.85);
  background: linear-gradient(135deg, #b45309 0%, #92400e 50%, #78350f 100%);
}
.rf-UR {
  --frame-color: #f87171; --frame-glow: rgba(248,113,113,1);
  background: linear-gradient(135deg, #be123c 0%, #7f1d1d 50%, #0c0a09 100%);
  animation: ur-pulse 2.5s ease-in-out infinite;
}
@keyframes ur-pulse {
  0%, 100% { box-shadow: 0 0 0 2px #f87171, 0 0 24px rgba(248,113,113,0.7), 0 4px 16px rgba(0,0,0,0.5); }
  50% { box-shadow: 0 0 0 2.5px #fbbf24, 0 0 36px rgba(251,191,36,0.9), 0 4px 16px rgba(0,0,0,0.5); }
}

.rf-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%);
  background-size: 200% 100%;
  animation: shimmer-move 3.5s linear infinite;
  z-index: 1;
  border-radius: 1rem;
}
@keyframes shimmer-move {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.rf-corners {
  position: absolute;
  inset: 0;
  z-index: 2;
}
.rf-corners span {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2.5px solid #fde047;
  filter: drop-shadow(0 0 4px #fde047);
}
.rf-corners span:nth-child(1) { top: 4px;    left: 4px;    border-right: none; border-bottom: none; }
.rf-corners span:nth-child(2) { top: 4px;    right: 4px;   border-left: none;  border-bottom: none; }
.rf-corners span:nth-child(3) { bottom: 4px; left: 4px;    border-right: none; border-top: none; }
.rf-corners span:nth-child(4) { bottom: 4px; right: 4px;   border-left: none;  border-top: none; }
</style>
