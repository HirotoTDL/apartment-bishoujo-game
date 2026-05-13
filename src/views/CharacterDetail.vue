<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { CHARACTERS_BY_ID } from "../game/data/characters";
import { SKILLS } from "../game/data/skills";
import { effectiveStats, maxMP, expForNextLevel, learnedSkills } from "../game/growth";
import { portraitForChar } from "../assets/placeholder";

const props = defineProps<{ uid: string }>();
const player = usePlayerStore();
const router = useRouter();

const char = computed(() => player.save!.owned.find(o => o.uid === props.uid)!);
const master = computed(() => CHARACTERS_BY_ID[char.value.charId]);
const stats = computed(() => effectiveStats(master.value, char.value.level, char.value.stage));
const mpMaxV = computed(() => maxMP(stats.value.mag, char.value.level));
const learned = computed(() => learnedSkills(master.value, char.value.level));
const expToNext = computed(() => expForNextLevel(char.value.level, master.value.growthCurve));

const allStagePortraits = computed(() => {
  return master.value.evolutions.map(e => ({
    stage: e.stage,
    url: portraitForChar(master.value.id, master.value.name, master.value.rarity, master.value.element, e.stage),
    unlocked: char.value.stage >= e.stage,
    desc: e.description,
    unlockLv: e.unlockLv,
  }));
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 text-white p-4 md:p-8">
    <header class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-bold">キャラクター詳細</h2>
      <button class="btn-secondary text-sm" @click="router.back()">← 戻る</button>
    </header>

    <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <section class="panel p-4">
        <img :src="portraitForChar(master.id, master.name, master.rarity, master.element, char.stage)" class="rounded-md w-full" />
        <div class="mt-3">
          <div class="flex items-center gap-2">
            <span :class="`text-xs px-2 py-0.5 rounded bg-rarity-${master.rarity} text-black font-bold`">{{ master.rarity }}</span>
            <span class="text-xs text-white/60">{{ master.element }}属性</span>
          </div>
          <h3 class="text-2xl font-bold mt-1">{{ master.name }}</h3>
          <p class="text-xs text-white/60">{{ master.apartmentSource }}</p>
          <p class="mt-2 text-sm">{{ master.lore }}</p>
        </div>
      </section>

      <section class="space-y-3">
        <div class="panel p-4">
          <div class="flex items-center gap-3">
            <div class="text-2xl font-bold">Lv {{ char.level }}</div>
            <div class="text-sm text-white/60">第{{ char.stage }}形態</div>
          </div>
          <div class="text-xs mt-1">経験値 {{ char.exp }} / {{ expToNext }}</div>
          <div class="h-2 bg-black/40 rounded overflow-hidden mt-1">
            <div class="h-full bg-yellow-400" :style="{ width: (char.exp / expToNext * 100) + '%' }"></div>
          </div>
        </div>

        <div class="panel p-4">
          <h4 class="font-bold mb-2">ステータス</h4>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>❤ HP: <span class="font-bold">{{ char.hp }} / {{ stats.hp }}</span></div>
            <div>💧 MP: <span class="font-bold">{{ char.mp }} / {{ mpMaxV }}</span></div>
            <div>⚔ ATK: {{ stats.atk }}</div>
            <div>🛡 DEF: {{ stats.def }}</div>
            <div>✨ MAG: {{ stats.mag }}</div>
            <div>💨 SPD: {{ stats.spd }}</div>
          </div>
        </div>

        <div class="panel p-4">
          <h4 class="font-bold mb-2">習得技</h4>
          <ul class="space-y-1 text-sm">
            <li v-for="sid in learned" :key="sid" class="border-b border-white/5 py-1">
              <div class="font-bold">{{ SKILLS[sid]?.name }}</div>
              <div class="text-xs text-white/60">{{ SKILLS[sid]?.description }} (MP {{ SKILLS[sid]?.mpCost }})</div>
            </li>
          </ul>
          <div v-if="master.skillLearnset.some(l => l.lv > char.level)" class="mt-2 text-xs text-white/40">
            次の技: Lv {{ master.skillLearnset.find(l => l.lv > char.level)!.lv }} で『{{ SKILLS[master.skillLearnset.find(l => l.lv > char.level)!.skill].name }}』
          </div>
        </div>
      </section>
    </div>

    <section class="max-w-4xl mx-auto mt-6 panel p-4">
      <h4 class="font-bold mb-3">進化段階</h4>
      <div class="grid grid-cols-3 gap-3">
        <div
          v-for="s in allStagePortraits"
          :key="s.stage"
          class="text-center"
          :class="s.unlocked ? '' : 'opacity-40'"
        >
          <img :src="s.url" class="rounded-md mx-auto" />
          <div class="mt-1 text-sm font-bold">第{{ s.stage }}形態</div>
          <div class="text-xs text-white/60">{{ s.unlocked ? "✓ 解放済" : `Lv ${s.unlockLv} で進化` }}</div>
          <div class="text-xs text-white/50 mt-1">{{ s.desc }}</div>
        </div>
      </div>
    </section>
  </div>
</template>
