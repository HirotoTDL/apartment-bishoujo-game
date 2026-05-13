<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { STAGES_BY_CHAPTER } from "../game/data/stages";
import AnimatedBackground from "../components/AnimatedBackground.vue";
import Icon from "../components/Icon.vue";

const router = useRouter();
const player = usePlayerStore();

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
</script>

<template>
  <div class="ss-root">
    <AnimatedBackground variant="cosmic" intensity="normal" />

    <header class="ss-header">
      <button class="ss-back" @click="$router.push({ name: 'home' })">
        <Icon name="arrow-back" :size="16" />
      </button>
      <div class="flex-1">
        <div class="ss-eyebrow">STORY MODE</div>
        <h2 class="ss-title">ステージ選択</h2>
      </div>
      <div class="ss-progress">
        <div class="ss-progress-label">CLEARED</div>
        <div class="ss-progress-val">
          <span>{{ player.save?.clearedStages.length || 0 }}</span>
          <small>/ 15</small>
        </div>
      </div>
    </header>

    <main class="ss-main">
      <div v-for="c in chapters" :key="c.chapter" class="chapter-block animate-fade-in-up">
        <div class="chapter-banner" :style="{ '--cc': c.theme.color, '--cf': c.theme.from, '--ct': c.theme.to, '--ca': c.theme.accent }">
          <div class="chapter-banner-bg"></div>
          <div class="chapter-banner-deco">
            <span class="chapter-roman">{{ c.chapter }}</span>
          </div>
          <div class="chapter-banner-text">
            <div class="chapter-banner-pre">{{ c.title }}</div>
            <div class="chapter-banner-sub">{{ c.subtitle }}</div>
          </div>
          <div class="chapter-banner-line"></div>
        </div>

        <div class="stage-list">
          <button
            v-for="s in c.stages" :key="s.id"
            class="stage-item"
            :class="[
              isUnlocked(s.id) ? 'stage-item--open' : 'stage-item--locked',
              isCleared(s.id) ? 'stage-item--cleared' : ''
            ]"
            :disabled="!isUnlocked(s.id)"
            @click="go(s.id)"
          >
            <div class="stage-item-glow" :style="{ background: `radial-gradient(circle, ${c.theme.color}55 0%, transparent 70%)` }"></div>

            <div class="stage-item-num" :style="{ borderColor: c.theme.color, color: c.theme.accent }">
              <div class="stage-num-pre">STAGE</div>
              <div class="stage-num-val">{{ s.id }}</div>
            </div>

            <div class="stage-item-body">
              <h4 class="stage-item-name">{{ s.name }}</h4>
              <p class="stage-item-desc">{{ s.description }}</p>
              <div class="stage-item-meta">
                <span><Icon name="sword" :size="11" />{{ s.battlesToClear }}戦</span>
                <span><Icon name="gold" :size="11" />{{ s.rewards.gold }}G</span>
                <span v-if="s.bossCharId"><Icon name="crown" :size="11" />BOSS</span>
                <span v-if="s.rarityCap"><Icon name="star" :size="11" />MAX {{ s.rarityCap }}</span>
              </div>
            </div>

            <div class="stage-item-status">
              <div v-if="isCleared(s.id)" class="status-stamp status-stamp--clear">
                <Icon name="check" :size="22" />
              </div>
              <div v-else-if="!isUnlocked(s.id)" class="status-stamp status-stamp--lock">
                <Icon name="lock" :size="18" />
              </div>
              <div v-else class="status-stamp status-stamp--play" :style="{ background: c.theme.color }">
                <Icon name="play" :size="18" />
              </div>
            </div>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.ss-root { min-height: 100vh; color: white; }

.ss-header {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.95), rgba(15, 8, 30, 0.55));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky; top: 0; z-index: 20;
}
.ss-back {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  color: white;
}
.ss-eyebrow {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.7);
}
.ss-title { font-size: 1.25rem; font-weight: 800; }
.ss-progress { text-align: right; }
.ss-progress-label {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(255,255,255,0.5);
}
.ss-progress-val {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
}
.ss-progress-val span { font-size: 1.5rem; color: #fde047; text-shadow: 0 0 12px rgba(253, 224, 71, 0.6); }
.ss-progress-val small { color: rgba(255,255,255,0.4); margin-left: 2px; }

.ss-main { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }

.chapter-block { margin-bottom: 2.5rem; }

/* === Chapter banner === */
.chapter-banner {
  position: relative;
  margin-bottom: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  overflow: hidden;
  display: flex; align-items: center; gap: 0.85rem;
  border: 1px solid color-mix(in srgb, var(--cc) 50%, transparent);
  background: linear-gradient(135deg, var(--cf), var(--ct));
}
.chapter-banner-bg {
  position: absolute; inset: 0;
  background:
    radial-gradient(circle at 80% 50%, color-mix(in srgb, var(--cc) 35%, transparent) 0%, transparent 60%),
    repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.025) 8px, rgba(255,255,255,0.025) 9px);
  pointer-events: none;
}
.chapter-banner-deco {
  position: relative; z-index: 1;
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--cc);
  border-radius: 50%;
  background: rgba(0,0,0,0.4);
  box-shadow: 0 0 18px color-mix(in srgb, var(--cc) 50%, transparent);
}
.chapter-roman {
  font-family: 'Orbitron', monospace;
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--ca);
  text-shadow: 0 0 12px currentColor;
}
.chapter-banner-text { position: relative; z-index: 1; flex: 1; }
.chapter-banner-pre {
  font-family: 'Orbitron', monospace;
  font-size: 11px;
  letter-spacing: 0.4em;
  color: color-mix(in srgb, var(--ca) 80%, white);
  text-shadow: 0 0 8px var(--cc);
}
.chapter-banner-sub {
  font-size: 1.25rem;
  font-weight: 800;
  margin-top: 4px;
  color: white;
  text-shadow: 0 1px 0 rgba(0,0,0,0.5);
}
.chapter-banner-line {
  position: absolute;
  right: 0; top: 50%; transform: translateY(-50%);
  width: 100px; height: 1px;
  background: linear-gradient(to right, transparent, var(--cc));
}

/* === Stage list === */
.stage-list { display: flex; flex-direction: column; gap: 0.55rem; }

.stage-item {
  position: relative;
  display: flex; align-items: stretch; gap: 0.85rem;
  padding: 0.85rem;
  background: linear-gradient(135deg, rgba(31, 21, 56, 0.85), rgba(15, 8, 30, 0.85));
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
  overflow: hidden;
}
.stage-item-glow {
  position: absolute;
  right: -50%; top: -50%;
  width: 100%; height: 200%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.stage-item--open:hover {
  border-color: rgba(255, 200, 230, 0.3);
  transform: translateX(4px);
}
.stage-item--open:hover .stage-item-glow { opacity: 1; }
.stage-item--locked { opacity: 0.38; cursor: not-allowed; }
.stage-item--cleared {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 8, 30, 0.85));
  border-color: rgba(110, 231, 183, 0.3);
}

.stage-item-num {
  position: relative; z-index: 1;
  flex-shrink: 0;
  width: 72px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 0.5rem 0.25rem;
  background: rgba(0, 0, 0, 0.4);
  border: 1.5px solid;
  border-radius: 6px;
}
.stage-num-pre {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.45);
}
.stage-num-val {
  font-family: 'Orbitron', monospace;
  font-size: 1.4rem;
  font-weight: 900;
  margin-top: 2px;
  text-shadow: 0 0 8px currentColor;
}

.stage-item-body {
  position: relative; z-index: 1;
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; justify-content: center;
}
.stage-item-name {
  font-size: 1.02rem;
  font-weight: 800;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}
.stage-item-desc {
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.55);
  margin: 3px 0 6px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.stage-item-meta {
  display: flex; gap: 0.85rem; flex-wrap: wrap;
  font-family: 'Orbitron', monospace;
  font-size: 9.5px;
  color: rgba(255, 200, 230, 0.7);
  letter-spacing: 0.05em;
}
.stage-item-meta span {
  display: inline-flex; align-items: center; gap: 3px;
}

.stage-item-status {
  position: relative; z-index: 1;
  display: flex; align-items: center; justify-content: center;
  width: 44px;
}
.status-stamp {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
}
.status-stamp--clear {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 0 14px rgba(16, 185, 129, 0.6);
}
.status-stamp--lock {
  background: rgba(255,255,255,0.05);
  border: 1.5px dashed rgba(255,255,255,0.3);
  color: rgba(255,255,255,0.5);
}
.status-stamp--play {
  color: white;
  box-shadow: 0 0 14px currentColor;
  animation: stamp-pulse 1.8s ease-in-out infinite;
}
@keyframes stamp-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}
</style>
