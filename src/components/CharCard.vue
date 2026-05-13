<script setup lang="ts">
import { computed } from "vue";
import { CHARACTERS_BY_ID } from "../game/data/characters";
import type { OwnedCharacter } from "../game/types";
import { effectiveStats, maxMP } from "../game/growth";
import { portraitForChar } from "../assets/placeholder";
import RarityFrame from "./RarityFrame.vue";

const props = defineProps<{
  char: OwnedCharacter;
  selected?: boolean;
  compact?: boolean;
}>();

const master = computed(() => CHARACTERS_BY_ID[props.char.charId]);
const stats = computed(() => effectiveStats(master.value!, props.char.level, props.char.stage));
const hpPct = computed(() => Math.max(0, props.char.hp / stats.value.hp) * 100);
const mpMaxV = computed(() => maxMP(stats.value.mag, props.char.level));
const mpPct = computed(() => Math.max(0, props.char.mp / Math.max(1, mpMaxV.value)) * 100);
const portrait = computed(() => portraitForChar(master.value!.id, master.value!.name, master.value!.rarity, master.value!.element, props.char.stage));

const elementSym: Record<string, string> = {
  fire: "🔥", water: "💧", wood: "🌿", light: "✨", dark: "🌙",
};
</script>

<template>
  <RarityFrame :rarity="master!.rarity" :interactive="true">
    <div
      class="cc relative"
      :class="[
        selected ? 'cc--selected' : '',
        compact ? 'cc--compact' : ''
      ]"
    >
      <!-- Top-left rarity badge -->
      <div class="absolute top-2 left-2 z-10 flex items-center gap-1.5">
        <span class="rarity-badge" :class="`rarity-badge-${master!.rarity}`">{{ master!.rarity }}</span>
        <span class="elem-badge" :class="`elem-${master!.element}`">{{ elementSym[master!.element] }}</span>
      </div>
      <!-- Top-right Lv -->
      <div class="absolute top-2 right-2 z-10 text-right">
        <div class="text-[10px] text-white/60 font-tech leading-none">LEVEL</div>
        <div class="font-tech text-xl font-extrabold text-white text-glow">{{ char.level }}</div>
      </div>

      <div class="cc-portrait">
        <img :src="portrait" :alt="master!.name" class="cc-portrait-img" />
        <div class="cc-portrait-fade" />
      </div>

      <div class="cc-info">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="font-bold text-base text-white truncate text-game-shadow flex-1">{{ master!.name }}</h3>
          <span class="text-[10px] text-white/50 font-tech">第{{ char.stage }}</span>
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center gap-2 text-xs">
            <span class="w-5 font-bold text-red-300 font-tech">HP</span>
            <div class="stat-bar flex-1">
              <div class="stat-bar-fill stat-bar-fill-hp" :style="{ width: hpPct + '%', color: '#ef4444' }"></div>
            </div>
            <span class="text-white/80 tabular-nums w-[68px] text-right text-[11px]">{{ char.hp }}/{{ stats.hp }}</span>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span class="w-5 font-bold text-blue-300 font-tech">MP</span>
            <div class="stat-bar flex-1">
              <div class="stat-bar-fill stat-bar-fill-mp" :style="{ width: mpPct + '%', color: '#3b82f6' }"></div>
            </div>
            <span class="text-white/80 tabular-nums w-[68px] text-right text-[11px]">{{ char.mp }}/{{ mpMaxV }}</span>
          </div>
        </div>
      </div>

      <div v-if="selected" class="cc-selected-glow pointer-events-none"></div>
    </div>
  </RarityFrame>
</template>

<style scoped>
.cc {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 0.65rem;
  padding: 0.5rem;
  min-height: 120px;
}
.cc--compact { min-height: 110px; }
.cc--compact .cc-portrait { width: 76px; height: 96px; }

.cc-portrait {
  position: relative;
  width: 96px;
  height: 116px;
  border-radius: 0.6rem;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset;
  background: radial-gradient(ellipse at top, rgba(255,255,255,0.06), transparent 60%);
}
.cc-portrait-img {
  width: 100%; height: 100%; object-fit: cover; display: block;
  filter: contrast(1.05) saturate(1.1);
}
.cc-portrait-fade {
  position: absolute; inset: auto 0 0 0; height: 25%;
  background: linear-gradient(to top, rgba(20,14,38,0.7), transparent);
}

.cc-info { padding: 0.25rem 0.25rem 0.1rem 0; min-width: 0; }

.cc-selected-glow {
  position: absolute;
  inset: -3px;
  border-radius: 1rem;
  background: linear-gradient(135deg, rgba(255,107,157,0.6), rgba(157,107,255,0.6));
  filter: blur(12px);
  z-index: -1;
  animation: pulse-glow 1.5s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}
</style>
