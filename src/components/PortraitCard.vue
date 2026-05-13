<script setup lang="ts">
import { computed } from "vue";
import { CHARACTERS_BY_ID } from "../game/data/characters";
import type { OwnedCharacter } from "../game/types";
import { effectiveStats, maxMP } from "../game/growth";
import { portraitForChar } from "../assets/placeholder";
import RarityStars from "./RarityStars.vue";
import Icon from "./Icon.vue";

const props = withDefaults(defineProps<{
  char: OwnedCharacter;
  selected?: boolean;
  showStats?: boolean;
}>(), {
  showStats: true,
});

const master = computed(() => CHARACTERS_BY_ID[props.char.charId]);
const stats = computed(() => effectiveStats(master.value!, props.char.level, props.char.stage));
const hpPct = computed(() => Math.max(0, props.char.hp / stats.value.hp) * 100);
const mpMaxV = computed(() => maxMP(stats.value.mag, props.char.level));
const mpPct = computed(() => Math.max(0, props.char.mp / Math.max(1, mpMaxV.value)) * 100);
const portrait = computed(() => portraitForChar(master.value!.id, master.value!.name, master.value!.rarity, master.value!.element, props.char.stage));
const rarity = computed(() => master.value!.rarity);
const element = computed(() => master.value!.element);
</script>

<template>
  <div class="pcard" :class="[`pcard-${rarity}`, selected && 'pcard--selected']">
    <!-- Holographic shimmer for SR+ -->
    <div v-if="['SR','SSR','UR'].includes(rarity)" class="pcard-holo"></div>

    <!-- Top bar -->
    <div class="pcard-top">
      <RarityStars :rarity="rarity" :size="11" />
      <div class="pcard-elem" :class="`elem-${element}`">
        <Icon :name="element" :size="14" />
      </div>
    </div>

    <!-- Portrait -->
    <div class="pcard-portrait">
      <img :src="portrait" :alt="master?.name" />
      <div class="pcard-portrait-grad"></div>
      <!-- Level chip -->
      <div class="pcard-lv-chip">
        <span class="pcard-lv-label">Lv</span>
        <span class="pcard-lv-num">{{ char.level }}</span>
      </div>
      <!-- Stage chip -->
      <div class="pcard-stage-chip">
        EVO {{ char.stage }}
      </div>
    </div>

    <!-- Name plate -->
    <div class="pcard-name-plate">
      <h3 class="pcard-name">{{ master?.name }}</h3>
    </div>

    <!-- Stats -->
    <div v-if="showStats" class="pcard-stats">
      <div class="pcard-bar-row">
        <span class="pcard-bar-label" style="color: #fca5a5">HP</span>
        <div class="pcard-bar">
          <div class="pcard-bar-fill pcard-bar-fill-hp" :style="{ width: hpPct + '%' }"></div>
        </div>
        <span class="pcard-bar-num">{{ char.hp }}/{{ stats.hp }}</span>
      </div>
      <div class="pcard-bar-row">
        <span class="pcard-bar-label" style="color: #93c5fd">MP</span>
        <div class="pcard-bar" style="height: 4px">
          <div class="pcard-bar-fill pcard-bar-fill-mp" :style="{ width: mpPct + '%' }"></div>
        </div>
        <span class="pcard-bar-num">{{ char.mp }}/{{ mpMaxV }}</span>
      </div>
    </div>

    <!-- Selected glow -->
    <div v-if="selected" class="pcard-selected-glow"></div>
  </div>
</template>

<style scoped>
.pcard {
  position: relative;
  width: 100%;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(.2,.9,.3,1.4), filter 0.25s ease;
  background: linear-gradient(180deg, #1a1130 0%, #0e0820 100%);
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
}
.pcard:hover { transform: translateY(-4px); filter: brightness(1.05); }

.pcard-N { box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(148,163,184,0.4); }
.pcard-R {
  background: linear-gradient(180deg, #1e3a8a 0%, #0e1530 100%);
  box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px #60a5fa, 0 0 16px rgba(96,165,250,0.4);
}
.pcard-SR {
  background: linear-gradient(180deg, #6d28d9 0%, #1a0a36 100%);
  box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 0 0 1.5px #c084fc, 0 0 22px rgba(192,132,252,0.5);
}
.pcard-SSR {
  background: linear-gradient(180deg, #b45309 0%, #1a0a02 100%);
  box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 0 0 1.5px #fbbf24, 0 0 26px rgba(251,191,36,0.6);
  animation: ssr-pulse 3s ease-in-out infinite;
}
.pcard-UR {
  background: linear-gradient(180deg, #be123c 0%, #1a0808 100%);
  box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 0 0 2px #f87171, 0 0 32px rgba(248,113,113,0.75);
  animation: ur-pulse 2.5s ease-in-out infinite;
}
@keyframes ssr-pulse {
  0%, 100% { box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 0 0 1.5px #fbbf24, 0 0 26px rgba(251,191,36,0.5); }
  50% { box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 0 1.5px #fde047, 0 0 40px rgba(251,191,36,0.85); }
}
@keyframes ur-pulse {
  0%, 100% { box-shadow: 0 4px 16px rgba(0,0,0,0.5), 0 0 0 2px #f87171, 0 0 32px rgba(248,113,113,0.7); }
  50% { box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 0 2.2px #fbbf24, 0 0 48px rgba(248,113,113,1); }
}

.pcard-holo {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg,
    transparent 30%,
    rgba(255,255,255,0.13) 38%,
    rgba(255,255,255,0.3) 42%,
    rgba(255,255,255,0.13) 46%,
    transparent 54%
  );
  background-size: 200% 100%;
  animation: holo-shine 4s linear infinite;
  pointer-events: none;
  z-index: 5;
  border-radius: 14px;
}
@keyframes holo-shine {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.pcard-top {
  position: absolute;
  top: 6px; left: 6px; right: 6px;
  display: flex; align-items: center; justify-content: space-between;
  z-index: 10;
}
.pcard-elem {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.15);
  color: #fff;
}

.pcard-portrait {
  position: relative;
  width: 100%;
  aspect-ratio: 3/4;
  overflow: hidden;
}
.pcard-portrait img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  filter: contrast(1.08) saturate(1.15);
}
.pcard-portrait-grad {
  position: absolute; inset: auto 0 0 0; height: 35%;
  background: linear-gradient(to top, rgba(14, 8, 32, 0.95), transparent);
}
.pcard-lv-chip {
  position: absolute;
  bottom: 8px; left: 8px;
  display: flex; align-items: baseline; gap: 3px;
  padding: 4px 8px;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 6px;
  z-index: 5;
}
.pcard-lv-label {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  color: rgba(255,255,255,0.65);
  letter-spacing: 0.1em;
}
.pcard-lv-num {
  font-family: 'Orbitron', monospace;
  font-size: 18px;
  font-weight: 900;
  color: #fde047;
  text-shadow: 0 0 8px rgba(253,224,71,0.7);
}
.pcard-stage-chip {
  position: absolute;
  bottom: 8px; right: 8px;
  padding: 3px 6px;
  background: rgba(255, 107, 157, 0.85);
  border-radius: 4px;
  font-family: 'Orbitron', monospace;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  z-index: 5;
}

.pcard-name-plate {
  padding: 8px 10px 4px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.4), transparent);
}
.pcard-name {
  font-size: 13px;
  font-weight: 800;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  letter-spacing: 0.02em;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pcard-stats {
  padding: 0 10px 10px;
  display: flex; flex-direction: column; gap: 4px;
}
.pcard-bar-row {
  display: flex; align-items: center; gap: 6px;
  font-family: 'Orbitron', monospace;
  font-size: 9px;
}
.pcard-bar-label {
  font-weight: 800; letter-spacing: 0.08em;
  width: 18px;
  text-shadow: 0 0 6px currentColor;
}
.pcard-bar {
  flex: 1;
  height: 6px;
  background: rgba(0,0,0,0.6);
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.5) inset;
}
.pcard-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}
.pcard-bar-fill-hp {
  background: linear-gradient(90deg, #f87171, #dc2626);
  box-shadow: 0 0 8px rgba(248,113,113,0.7);
}
.pcard-bar-fill-mp {
  background: linear-gradient(90deg, #60a5fa, #1d4ed8);
  box-shadow: 0 0 8px rgba(96,165,250,0.7);
}
.pcard-bar-num {
  color: rgba(255,255,255,0.8);
  font-weight: 700;
  font-size: 9px;
  min-width: 60px;
  text-align: right;
}

.pcard--selected { transform: translateY(-2px) scale(1.03); }
.pcard-selected-glow {
  position: absolute;
  inset: -4px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255,107,157,0.7), rgba(157,107,255,0.7));
  filter: blur(14px);
  z-index: -1;
  animation: select-pulse 1.5s ease-in-out infinite;
}
@keyframes select-pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
