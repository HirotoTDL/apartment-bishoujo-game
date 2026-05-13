<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { STAGES_BY_CHAPTER } from "../game/data/stages";
import AnimatedBackground from "../components/AnimatedBackground.vue";

const router = useRouter();
const player = usePlayerStore();

const chapters = computed(() => {
  return Object.entries(STAGES_BY_CHAPTER)
    .map(([ch, list]) => ({
      chapter: Number(ch),
      title: chapterTitle(Number(ch)),
      subtitle: chapterSubtitle(Number(ch)),
      stages: list,
      bg: chapterBg(Number(ch)),
    }))
    .sort((a, b) => a.chapter - b.chapter);
});

function chapterTitle(ch: number): string {
  const titles: Record<number, string> = {
    1: "序章", 2: "第二章", 3: "第三章", 4: "第四章", 5: "終章",
  };
  return titles[ch] ?? `第${ch}章`;
}
function chapterSubtitle(ch: number): string {
  const t: Record<number, string> = {
    1: "あなたの新しい住処", 2: "R級住宅地", 3: "SR領域", 4: "SSR名邸", 5: "UR聖域",
  };
  return t[ch] ?? "";
}
function chapterBg(ch: number): string {
  const c: Record<number, string> = {
    1: "from-slate-700 to-slate-900",
    2: "from-blue-700 to-blue-950",
    3: "from-violet-700 to-violet-950",
    4: "from-amber-600 to-orange-900",
    5: "from-rose-600 via-red-800 to-slate-950",
  };
  return c[ch] ?? "from-gray-700 to-gray-950";
}

function isUnlocked(stageId: string): boolean { return player.save!.unlockedStages.includes(stageId); }
function isCleared(stageId: string): boolean { return player.save!.clearedStages.includes(stageId); }
function go(stageId: string) { if (isUnlocked(stageId)) router.push({ name: "battle", params: { stageId } }); }

</script>

<template>
  <div class="stage-root min-h-screen text-white">
    <AnimatedBackground variant="cosmic" intensity="normal" />

    <header class="stage-header">
      <button class="btn-secondary text-sm" @click="$router.push({ name: 'home' })">← ホームへ</button>
      <h2 class="text-xl font-bold text-game-shadow">ストーリー</h2>
      <div class="text-xs text-white/50 font-tech">{{ player.save?.clearedStages.length || 0 }} CLEARED</div>
    </header>

    <main class="stage-main">
      <div v-for="c in chapters" :key="c.chapter" class="chapter-section animate-fade-in-up">
        <div class="chapter-title-row">
          <div class="chapter-title-bg" :class="'bg-gradient-to-r ' + c.bg"></div>
          <div class="chapter-title-text">
            <div class="text-[10px] text-white/60 tracking-widest font-tech">CHAPTER {{ c.chapter }}</div>
            <h3 class="text-xl font-bold text-game-shadow">{{ c.title }} <span class="text-pink-300">—</span> {{ c.subtitle }}</h3>
          </div>
        </div>
        <div class="stage-grid">
          <button
            v-for="s in c.stages"
            :key="s.id"
            class="stage-card"
            :class="[
              isUnlocked(s.id) ? 'stage-card--open card-hover' : 'stage-card--locked',
              isCleared(s.id) ? 'stage-card--cleared' : ''
            ]"
            :disabled="!isUnlocked(s.id)"
            @click="go(s.id)"
          >
            <div class="stage-card-id">
              <span class="font-tech text-xs">STAGE</span>
              <div class="font-tech text-2xl font-extrabold text-glow">{{ s.id }}</div>
            </div>
            <div class="stage-card-body">
              <h4 class="font-bold text-base mb-0.5">{{ s.name }}</h4>
              <p class="text-xs text-white/60 mb-2 line-clamp-2">{{ s.description }}</p>
              <div class="flex gap-3 text-[10px] text-white/60 font-tech">
                <span>⚔ {{ s.battlesToClear }} BATTLES</span>
                <span>💰 {{ s.rewards.gold }}G</span>
                <span v-if="s.bossCharId">👑 BOSS</span>
              </div>
            </div>
            <div class="stage-card-status">
              <span v-if="isCleared(s.id)" class="status-cleared">✓ CLEAR</span>
              <span v-else-if="!isUnlocked(s.id)" class="status-locked">🔒</span>
              <span v-else class="status-open">▶</span>
            </div>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.stage-header {
  display: flex; align-items: center; gap: 1rem; justify-content: space-between;
  padding: 0.75rem 1rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.85), rgba(15, 8, 30, 0.4));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  position: sticky; top: 0; z-index: 20;
}

.stage-main {
  max-width: 1100px; margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}

.chapter-section { margin-bottom: 2rem; }
.chapter-title-row {
  position: relative;
  padding: 0.75rem 1rem;
  margin-bottom: 0.85rem;
  border-radius: 0.6rem;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
}
.chapter-title-bg {
  position: absolute; inset: 0;
  opacity: 0.35;
}
.chapter-title-row::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(0,0,0,0.5), transparent 50%);
}
.chapter-title-text { position: relative; z-index: 1; }

.stage-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem;
}
@media (min-width: 700px) {
  .stage-grid { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 1024px) {
  .stage-grid { grid-template-columns: 1fr 1fr 1fr; }
}

.stage-card {
  display: flex; align-items: stretch; gap: 0.75rem;
  padding: 0.85rem;
  text-align: left;
  background: linear-gradient(135deg, rgba(31, 21, 56, 0.85), rgba(42, 28, 74, 0.85));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  transition: all 0.25s ease;
  cursor: pointer;
  min-height: 90px;
}
.stage-card--open:hover {
  border-color: rgba(255, 107, 157, 0.5);
  box-shadow: 0 0 24px rgba(255,107,157,0.2), 0 6px 18px rgba(0,0,0,0.4);
}
.stage-card--locked {
  opacity: 0.35;
  cursor: not-allowed;
}
.stage-card--cleared {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1));
  border-color: rgba(52, 211, 153, 0.4);
}

.stage-card-id {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  min-width: 60px;
  padding: 0 0.5rem;
  border-right: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.8);
}
.stage-card-body { flex: 1; min-width: 0; }
.stage-card-status {
  display: flex; align-items: center; justify-content: center;
  min-width: 32px;
  font-family: 'Orbitron', monospace;
  font-weight: 700;
}
.status-cleared { color: #34d399; font-size: 10px; letter-spacing: 0.1em; }
.status-locked { color: rgba(255,255,255,0.4); font-size: 1.25rem; }
.status-open { color: #ff6b9d; font-size: 1.5rem; text-shadow: 0 0 8px rgba(255,107,157,0.6); }
</style>
