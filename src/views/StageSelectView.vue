<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { STAGES_BY_CHAPTER } from "../game/data/stages";
import ScenicBackground from "../components/ScenicBackground.vue";
import Icon from "../components/Icon.vue";

const router = useRouter();
const player = usePlayerStore();
const chapterIdx = ref(0);

const chapters = computed(() => {
  return Object.entries(STAGES_BY_CHAPTER)
    .map(([ch, list]) => ({
      chapter: Number(ch),
      title: chapterTitle(Number(ch)),
      subtitle: chapterSubtitle(Number(ch)),
      stages: list,
      theme: chapterTheme(Number(ch)),
    }))
    .sort((a, b) => a.chapter - b.chapter);
});
const activeChapter = computed(() => chapters.value[chapterIdx.value] ?? chapters.value[0]);

function chapterTitle(ch: number) {
  return ({ 1: "PROLOGUE", 2: "CHAPTER II", 3: "CHAPTER III", 4: "CHAPTER IV", 5: "FINALE" } as Record<number, string>)[ch] ?? `CH ${ch}`;
}
function chapterSubtitle(ch: number) {
  return ({ 1: "あなたの新しい住処", 2: "R級住宅地", 3: "SR領域", 4: "SSR名邸", 5: "UR聖域" } as Record<number, string>)[ch] ?? "";
}
function chapterTheme(ch: number): { color: string; from: string; to: string; accent: string } {
  const themes: Record<number, { color: string; from: string; to: string; accent: string }> = {
    1: { color: "#94a3b8", from: "#1e293b", to: "#0f172a", accent: "#cbd5e1" },
    2: { color: "#60a5fa", from: "#1e3a8a", to: "#0c1736", accent: "#93c5fd" },
    3: { color: "#c084fc", from: "#6d28d9", to: "#1e1b4b", accent: "#d8b4fe" },
    4: { color: "#fbbf24", from: "#b45309", to: "#451a03", accent: "#fde68a" },
    5: { color: "#fb7185", from: "#be123c", to: "#1c0a0a", accent: "#fca5a5" },
  };
  return themes[ch] ?? themes[1];
}

function isUnlocked(stageId: string) { return player.save!.unlockedStages.includes(stageId); }
function isCleared(stageId: string) { return player.save!.clearedStages.includes(stageId); }
function go(stageId: string) { if (isUnlocked(stageId)) router.push({ name: "battle", params: { stageId } }); }
function prevChapter() { chapterIdx.value = Math.max(0, chapterIdx.value - 1); }
function nextChapter() { chapterIdx.value = Math.min(chapters.value.length - 1, chapterIdx.value + 1); }
</script>

<template>
  <div class="ss-root">
    <ScenicBackground scene="map" />

    <header class="ss-header">
      <button class="ss-back" @click="router.push({ name: 'home' })"><Icon name="arrow-back" :size="14" /></button>
      <div>
        <div class="ss-eyebrow">STORY MODE</div>
        <h2 class="ss-title">ステージ選択</h2>
      </div>
      <div class="ss-progress">
        <div class="ss-progress-label">CLEARED</div>
        <div class="ss-progress-val">
          <span>{{ player.save?.clearedStages.length || 0 }}</span><small>/ 15</small>
        </div>
      </div>
    </header>

    <!-- Chapter pager -->
    <div class="chapter-pager">
      <button class="pager-btn" :disabled="chapterIdx === 0" @click="prevChapter"><Icon name="arrow-back" :size="14" /></button>
      <div class="pager-tabs">
        <button v-for="(c, i) in chapters" :key="c.chapter"
          class="pager-tab" :class="i === chapterIdx && 'pager-tab--active'"
          :style="i === chapterIdx ? { borderColor: c.theme.color, color: c.theme.accent } : {}"
          @click="chapterIdx = i"
        >
          <span class="pager-tab-num">{{ c.chapter }}</span>
          <span class="pager-tab-label">{{ c.title }}</span>
        </button>
      </div>
      <button class="pager-btn" :disabled="chapterIdx === chapters.length - 1" @click="nextChapter"><Icon name="arrow-right" :size="14" /></button>
    </div>

    <main class="ss-main">
      <!-- Chapter banner -->
      <div class="chapter-banner"
        :style="{ '--cc': activeChapter.theme.color, '--cf': activeChapter.theme.from, '--ct': activeChapter.theme.to, '--ca': activeChapter.theme.accent }">
        <div class="banner-bg"></div>
        <div class="banner-medallion">
          <span>{{ activeChapter.chapter }}</span>
        </div>
        <div class="banner-text">
          <div class="banner-pre">{{ activeChapter.title }}</div>
          <div class="banner-sub">{{ activeChapter.subtitle }}</div>
        </div>
      </div>

      <!-- Stage grid -->
      <div class="stage-grid">
        <button
          v-for="s in activeChapter.stages" :key="s.id"
          class="stage-item"
          :class="[
            isUnlocked(s.id) ? 'stage-open' : 'stage-locked',
            isCleared(s.id) && 'stage-cleared'
          ]"
          :disabled="!isUnlocked(s.id)"
          @click="go(s.id)"
        >
          <div class="stage-glow" :style="{ background: `radial-gradient(circle, ${activeChapter.theme.color}44 0%, transparent 70%)` }"></div>
          <div class="stage-num" :style="{ borderColor: activeChapter.theme.color, color: activeChapter.theme.accent }">
            <div class="stage-num-pre">STAGE</div>
            <div class="stage-num-val">{{ s.id }}</div>
          </div>
          <div class="stage-body">
            <h4 class="stage-name">{{ s.name }}</h4>
            <p class="stage-desc">{{ s.description }}</p>
            <div class="stage-meta">
              <span><Icon name="sword" :size="10" />{{ s.battlesToClear }}戦</span>
              <span><Icon name="gold" :size="10" />{{ s.rewards.gold }}G</span>
              <span v-if="s.bossCharId"><Icon name="crown" :size="10" />BOSS</span>
            </div>
          </div>
          <div class="stage-status">
            <div v-if="isCleared(s.id)" class="status-stamp status-clear"><Icon name="check" :size="18" /></div>
            <div v-else-if="!isUnlocked(s.id)" class="status-stamp status-lock"><Icon name="lock" :size="14" /></div>
            <div v-else class="status-stamp status-play" :style="{ background: activeChapter.theme.color }"><Icon name="play" :size="14" /></div>
          </div>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.ss-root {
  position: absolute; inset: 0;
  overflow: hidden;
  color: white;
  display: flex; flex-direction: column;
}

.ss-header {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 0.9rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.92), rgba(15, 8, 30, 0.55));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
.ss-back {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 5px; color: white;
}
.ss-eyebrow { font-family: 'Orbitron', monospace; font-size: 9px; letter-spacing: 0.3em; color: rgba(255, 200, 230, 0.7); }
.ss-title { font-size: 1.1rem; font-weight: 800; margin: 1px 0 0; }
.ss-progress { margin-left: auto; text-align: right; }
.ss-progress-label { font-family: 'Orbitron', monospace; font-size: 8px; letter-spacing: 0.2em; color: rgba(255,255,255,0.5); }
.ss-progress-val { font-family: 'Orbitron', monospace; font-weight: 900; font-size: 1.2rem; }
.ss-progress-val span { color: #fde047; text-shadow: 0 0 10px rgba(253, 224, 71, 0.6); }
.ss-progress-val small { color: rgba(255,255,255,0.35); font-size: 0.7rem; margin-left: 1px; }

/* Pager */
.chapter-pager {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  background: rgba(15, 8, 30, 0.65);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.pager-btn {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 5px;
  color: rgba(255,255,255,0.8);
}
.pager-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pager-btn:hover:not(:disabled) { background: rgba(255, 107, 157, 0.2); }
.pager-tabs { flex: 1; display: flex; gap: 0.3rem; justify-content: center; flex-wrap: wrap; }
.pager-tab {
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 5px;
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.6);
}
.pager-tab:hover { background: rgba(255,255,255,0.1); color: white; }
.pager-tab--active {
  background: rgba(255,255,255,0.08);
  font-weight: 900;
  text-shadow: 0 0 8px currentColor;
}
.pager-tab-num {
  font-size: 13px;
  padding: 0 5px;
  border-right: 1px solid currentColor;
}

.ss-main {
  flex: 1; min-height: 0;
  padding: 0.85rem;
  display: flex; flex-direction: column; gap: 0.7rem;
}

.chapter-banner {
  position: relative;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  overflow: hidden;
  display: flex; align-items: center; gap: 0.85rem;
  border: 1px solid color-mix(in srgb, var(--cc) 50%, transparent);
  background: linear-gradient(135deg, var(--cf), var(--ct));
  flex-shrink: 0;
}
.banner-bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 80% 50%, color-mix(in srgb, var(--cc) 30%, transparent) 0%, transparent 60%),
    repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.02) 8px, rgba(255,255,255,0.02) 9px);
}
.banner-medallion {
  position: relative; z-index: 1;
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--cc);
  border-radius: 50%;
  background: rgba(0,0,0,0.4);
  box-shadow: 0 0 16px color-mix(in srgb, var(--cc) 50%, transparent);
}
.banner-medallion span {
  font-family: 'Orbitron', monospace;
  font-size: 1.2rem; font-weight: 900;
  color: var(--ca);
  text-shadow: 0 0 10px currentColor;
}
.banner-text { position: relative; z-index: 1; }
.banner-pre {
  font-family: 'Orbitron', monospace;
  font-size: 10px; letter-spacing: 0.4em;
  color: var(--ca);
}
.banner-sub { font-size: 1.05rem; font-weight: 800; margin-top: 2px; }

.stage-grid {
  flex: 1; min-height: 0;
  overflow-y: auto;
  display: flex; flex-direction: column; gap: 0.45rem;
  padding-right: 0.25rem;
}
.stage-grid::-webkit-scrollbar { width: 5px; }
.stage-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }

.stage-item {
  position: relative;
  display: flex; align-items: stretch; gap: 0.75rem;
  padding: 0.7rem;
  background: linear-gradient(135deg, rgba(31, 21, 56, 0.85), rgba(15, 8, 30, 0.85));
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
  overflow: hidden;
}
.stage-glow { position: absolute; right: -50%; top: -50%; width: 100%; height: 200%; pointer-events: none; opacity: 0; transition: opacity 0.3s ease; }
.stage-open:hover { border-color: rgba(255, 200, 230, 0.3); transform: translateX(4px); }
.stage-open:hover .stage-glow { opacity: 1; }
.stage-locked { opacity: 0.4; cursor: not-allowed; }
.stage-cleared { background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 8, 30, 0.85)); border-color: rgba(110, 231, 183, 0.3); }

.stage-num {
  position: relative; z-index: 1;
  flex-shrink: 0;
  width: 56px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 0.35rem 0.25rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1.5px solid;
  border-radius: 5px;
}
.stage-num-pre { font-family: 'Orbitron', monospace; font-size: 8px; letter-spacing: 0.2em; color: rgba(255, 255, 255, 0.45); }
.stage-num-val { font-family: 'Orbitron', monospace; font-size: 1.15rem; font-weight: 900; margin-top: 1px; }

.stage-body { position: relative; z-index: 1; flex: 1; min-width: 0; }
.stage-name { font-size: 0.92rem; font-weight: 800; margin: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
.stage-desc { font-size: 11px; color: rgba(255, 255, 255, 0.55); margin: 2px 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stage-meta { display: flex; gap: 0.7rem; flex-wrap: wrap; font-family: 'Orbitron', monospace; font-size: 9px; color: rgba(255, 200, 230, 0.7); }
.stage-meta span { display: inline-flex; align-items: center; gap: 2px; }

.stage-status { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; width: 38px; flex-shrink: 0; }
.status-stamp {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
}
.status-clear { background: linear-gradient(135deg, #10b981, #059669); color: white; box-shadow: 0 0 12px rgba(16, 185, 129, 0.6); }
.status-lock { background: rgba(255,255,255,0.05); border: 1.5px dashed rgba(255,255,255,0.3); color: rgba(255,255,255,0.5); }
.status-play { color: white; box-shadow: 0 0 12px currentColor; animation: stamp-pulse 1.8s ease-in-out infinite; }
@keyframes stamp-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
</style>
