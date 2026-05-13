<script setup lang="ts">
import { computed } from "vue";
import { CHARACTERS_BY_ID } from "../game/data/characters";
import type { OwnedCharacter } from "../game/types";
import { effectiveStats, maxMP } from "../game/growth";
import { portraitForChar } from "../assets/placeholder";

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
</script>

<template>
  <div
    class="panel p-3 transition flex gap-3 items-center"
    :class="[
      selected ? 'ring-2 ring-ui-accent shadow-glow' : 'opacity-90 hover:opacity-100',
      compact ? 'min-h-[100px]' : 'min-h-[120px]'
    ]"
  >
    <img
      :src="portrait"
      :alt="master?.name"
      class="rounded-md flex-shrink-0"
      :class="compact ? 'w-16 h-20' : 'w-20 h-24'"
    />
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold px-2 py-0.5 rounded"
              :class="`bg-rarity-${master?.rarity} text-black`">{{ master?.rarity }}</span>
        <span class="text-xs text-white/60">Lv {{ char.level }}</span>
        <span class="text-xs text-white/60">第{{ char.stage }}形態</span>
      </div>
      <h3 class="font-bold text-base truncate mt-1">{{ master?.name }}</h3>
      <div class="mt-2 space-y-1">
        <div class="flex items-center gap-2 text-xs">
          <span class="w-7 text-red-300">HP</span>
          <div class="flex-1 h-2 bg-black/40 rounded overflow-hidden">
            <div class="h-full bg-red-500" :style="{ width: hpPct + '%' }"></div>
          </div>
          <span class="text-white/70 tabular-nums w-16 text-right">{{ char.hp }}/{{ stats.hp }}</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="w-7 text-blue-300">MP</span>
          <div class="flex-1 h-2 bg-black/40 rounded overflow-hidden">
            <div class="h-full bg-blue-500" :style="{ width: mpPct + '%' }"></div>
          </div>
          <span class="text-white/70 tabular-nums w-16 text-right">{{ char.mp }}/{{ mpMaxV }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
