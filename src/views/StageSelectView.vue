<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { STAGES_BY_CHAPTER } from "../game/data/stages";

const router = useRouter();
const player = usePlayerStore();

const chapters = computed(() => {
  return Object.entries(STAGES_BY_CHAPTER)
    .map(([ch, list]) => ({
      chapter: Number(ch),
      title: chapterTitle(Number(ch)),
      stages: list,
    }))
    .sort((a, b) => a.chapter - b.chapter);
});

function chapterTitle(ch: number): string {
  const titles: Record<number, string> = {
    1: "序章 — あなたの新しい住処",
    2: "第二章 — R級住宅地",
    3: "第三章 — SR領域",
    4: "第四章 — SSR名邸",
    5: "終章 — UR聖域",
  };
  return titles[ch] ?? `第${ch}章`;
}

function isUnlocked(stageId: string): boolean {
  return player.save!.unlockedStages.includes(stageId);
}
function isCleared(stageId: string): boolean {
  return player.save!.clearedStages.includes(stageId);
}
function go(stageId: string) {
  if (!isUnlocked(stageId)) return;
  router.push({ name: "battle", params: { stageId } });
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-950 to-indigo-950 text-white p-4 md:p-8">
    <header class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold">ステージ選択</h2>
      <button class="btn-secondary text-sm" @click="$router.push({ name: 'home' })">← ホームへ</button>
    </header>

    <div v-for="c in chapters" :key="c.chapter" class="mb-8 max-w-4xl mx-auto">
      <h3 class="text-lg font-bold mb-2 text-pink-200">{{ c.title }}</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          v-for="s in c.stages"
          :key="s.id"
          class="panel p-4 text-left transition flex flex-col"
          :class="isUnlocked(s.id) ? 'hover:bg-white/5 cursor-pointer' : 'opacity-40 cursor-not-allowed'"
          :disabled="!isUnlocked(s.id)"
          @click="go(s.id)"
        >
          <div class="flex items-center gap-2">
            <span class="font-bold">{{ s.id }}</span>
            <span class="ml-auto text-xs" v-if="isCleared(s.id)">✓ クリア済</span>
            <span class="ml-auto text-xs text-white/50" v-else-if="!isUnlocked(s.id)">🔒 未開放</span>
          </div>
          <div class="font-semibold mt-1">{{ s.name }}</div>
          <div class="text-xs text-white/60 mt-1">{{ s.description }}</div>
          <div class="text-xs text-white/40 mt-2">バトル数 {{ s.battlesToClear }} / 報酬 {{ s.rewards.gold }}G</div>
        </button>
      </div>
    </div>
  </div>
</template>
