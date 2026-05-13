<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { CHARACTERS_BY_ID } from "../game/data/characters";
import { SKILLS, ELEMENT_LABEL } from "../game/data/skills";
import { effectiveStats, maxMP, expForNextLevel, learnedSkills } from "../game/growth";
import { portraitForChar } from "../assets/placeholder";
import AnimatedBackground from "../components/AnimatedBackground.vue";
import Icon from "../components/Icon.vue";
import RarityStars from "../components/RarityStars.vue";

const props = defineProps<{ uid: string }>();
const player = usePlayerStore();
const router = useRouter();

const char = computed(() => player.save!.owned.find(o => o.uid === props.uid)!);
const master = computed(() => CHARACTERS_BY_ID[char.value.charId]);
const stats = computed(() => effectiveStats(master.value, char.value.level, char.value.stage));
const mpMaxV = computed(() => maxMP(stats.value.mag, char.value.level));
const learned = computed(() => learnedSkills(master.value, char.value.level));
const expToNext = computed(() => expForNextLevel(char.value.level, master.value.growthCurve));

const stagePortraits = computed(() => master.value.evolutions.map(e => ({
  stage: e.stage,
  url: portraitForChar(master.value.id, master.value.name, master.value.rarity, master.value.element, e.stage),
  unlocked: char.value.stage >= e.stage,
  desc: e.description,
  unlockLv: e.unlockLv,
})));

const statItems = computed(() => [
  { label: "HP", val: `${char.value.hp}/${stats.value.hp}`, icon: "heart", color: "#f87171" },
  { label: "MP", val: `${char.value.mp}/${mpMaxV.value}`, icon: "water", color: "#60a5fa" },
  { label: "ATK", val: stats.value.atk, icon: "sword", color: "#fbbf24" },
  { label: "DEF", val: stats.value.def, icon: "shield", color: "#a78bfa" },
  { label: "MAG", val: stats.value.mag, icon: "magic", color: "#f472b6" },
  { label: "SPD", val: stats.value.spd, icon: "sparkle", color: "#34d399" },
]);

function skillIconFor(s: any): string {
  if (!s) return "sword";
  if (s.kind === "heal") return "heart";
  if (s.kind === "buff") return "arrow-up";
  if (s.kind === "debuff") return "arrow-down";
  if (s.element && ["fire", "water", "wood", "light", "dark"].includes(s.element)) return s.element;
  return "sword";
}
</script>

<template>
  <div class="cd-root">
    <AnimatedBackground :variant="(master.element as any) || 'cosmic'" intensity="normal" />

    <header class="cd-header">
      <button class="cd-back" @click="router.back()">
        <Icon name="arrow-back" :size="16" />
      </button>
      <div class="flex-1">
        <div class="cd-eyebrow">CHARACTER PROFILE</div>
        <h2 class="cd-title">{{ master.name }}</h2>
      </div>
      <div class="cd-rarity">
        <span class="cd-rarity-badge" :class="`rarity-badge-${master.rarity}`">{{ master.rarity }}</span>
      </div>
    </header>

    <main class="cd-main">
      <div class="cd-grid">
        <!-- LEFT: portrait + lore -->
        <section class="cd-left">
          <div class="cd-portrait-card" :class="`rarity-${master.rarity}`">
            <img :src="portraitForChar(master.id, master.name, master.rarity, master.element, char.stage)" class="cd-portrait-img" />
            <div class="cd-portrait-grad"></div>
            <div class="cd-portrait-top">
              <RarityStars :rarity="master.rarity" :size="12" />
              <span class="cd-elem-pill" :class="`elem-${master.element}`">
                <Icon :name="master.element" :size="13" />
                <span>{{ ELEMENT_LABEL[master.element] }}</span>
              </span>
            </div>
            <div class="cd-portrait-bot">
              <div class="cd-stage-chip">EVO {{ char.stage }}</div>
            </div>
          </div>

          <div class="cd-lore">
            <div class="cd-section-eyebrow">📜 LORE</div>
            <p class="cd-lore-text">{{ master.lore }}</p>
            <div class="cd-lore-src">
              <span class="cd-lore-src-label">由来:</span>
              <span>{{ master.apartmentSource }}</span>
            </div>
          </div>
        </section>

        <!-- RIGHT: level + stats + skills -->
        <section class="cd-right">
          <!-- Level card -->
          <div class="cd-level-card">
            <div class="cd-level-row">
              <div>
                <div class="cd-section-eyebrow">⚡ LEVEL</div>
                <div class="cd-level-display">
                  <span class="cd-level-num">{{ char.level }}</span>
                  <span class="cd-level-max">/ 99</span>
                </div>
              </div>
              <div class="cd-stage-display">
                <div class="cd-section-eyebrow">★ STAGE</div>
                <div class="cd-stage-num">{{ char.stage }} <span>/ 3</span></div>
              </div>
            </div>
            <div class="cd-exp-bar">
              <div class="cd-exp-bar-fill" :style="{ width: (char.exp / expToNext * 100) + '%' }"></div>
            </div>
            <div class="cd-exp-info">
              <span>EXP {{ char.exp.toLocaleString() }}</span>
              <span>{{ expToNext.toLocaleString() }} で次レベル</span>
            </div>
          </div>

          <!-- Stats grid -->
          <div class="cd-stats-card">
            <div class="cd-section-eyebrow">⚔ STATS</div>
            <div class="cd-stats-grid">
              <div v-for="s in statItems" :key="s.label" class="cd-stat-cell" :style="{ borderColor: s.color + '4d' }">
                <span class="cd-stat-icon" :style="{ color: s.color }"><Icon :name="s.icon" :size="20" /></span>
                <div class="cd-stat-text">
                  <div class="cd-stat-label">{{ s.label }}</div>
                  <div class="cd-stat-val">{{ s.val }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Skills -->
          <div class="cd-skills-card">
            <div class="cd-section-eyebrow">✦ SKILLS</div>
            <div class="cd-skills-list">
              <div v-for="sid in learned" :key="sid" class="cd-skill-row" :class="`skill-${SKILLS[sid]?.element || 'neutral'}`">
                <div class="cd-skill-icon"><Icon :name="skillIconFor(SKILLS[sid])" :size="18" /></div>
                <div class="cd-skill-text">
                  <div class="cd-skill-name">{{ SKILLS[sid]?.name }}</div>
                  <div class="cd-skill-desc">{{ SKILLS[sid]?.description }}</div>
                </div>
                <div v-if="SKILLS[sid]?.mpCost" class="cd-skill-mp">
                  <span>{{ SKILLS[sid]?.mpCost }}</span><small>MP</small>
                </div>
              </div>
            </div>
            <div v-if="master.skillLearnset.some(l => l.lv > char.level)" class="cd-skill-next">
              <Icon name="lock" :size="12" />
              <span>Lv {{ master.skillLearnset.find(l => l.lv > char.level)!.lv }} で
                <b>{{ SKILLS[master.skillLearnset.find(l => l.lv > char.level)!.skill].name }}</b> を習得
              </span>
            </div>
          </div>
        </section>
      </div>

      <!-- Evolutions -->
      <section class="cd-evos">
        <div class="cd-section-eyebrow">⟡ EVOLUTION STAGES</div>
        <div class="cd-evos-grid">
          <div v-for="s in stagePortraits" :key="s.stage" class="cd-evo-card" :class="[s.unlocked ? 'cd-evo--open' : 'cd-evo--locked', `rarity-${master.rarity}`]">
            <div class="cd-evo-img">
              <img :src="s.url" />
              <div v-if="!s.unlocked" class="cd-evo-lock">
                <Icon name="lock" :size="28" />
                <div>Lv {{ s.unlockLv }}</div>
              </div>
            </div>
            <div class="cd-evo-info">
              <div class="cd-evo-stage">第{{ s.stage }}形態 <span v-if="s.unlocked" class="cd-evo-check"><Icon name="check" :size="11" /></span></div>
              <p class="cd-evo-desc">{{ s.desc }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.cd-root { min-height: 100vh; color: white; }

.cd-header {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.95), rgba(15, 8, 30, 0.55));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky; top: 0; z-index: 20;
}
.cd-back {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  color: white;
}
.cd-eyebrow {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.7);
}
.cd-title { font-size: 1.25rem; font-weight: 800; }
.cd-rarity-badge {
  font-family: 'Orbitron', monospace;
  font-size: 14px;
  font-weight: 900;
  padding: 4px 10px;
  border-radius: 4px;
  color: white;
  letter-spacing: 0.08em;
}
.rarity-badge-N { background: linear-gradient(135deg, #94a3b8, #475569); }
.rarity-badge-R { background: linear-gradient(135deg, #60a5fa, #1d4ed8); box-shadow: 0 0 10px rgba(96,165,250,0.4); }
.rarity-badge-SR { background: linear-gradient(135deg, #c084fc, #7c3aed); box-shadow: 0 0 12px rgba(192,132,252,0.5); }
.rarity-badge-SSR { background: linear-gradient(135deg, #fbbf24, #d97706); box-shadow: 0 0 14px rgba(251,191,36,0.6); }
.rarity-badge-UR { background: linear-gradient(135deg, #f87171, #be123c); box-shadow: 0 0 16px rgba(248,113,113,0.7); }

.cd-main { max-width: 1100px; margin: 0 auto; padding: 1.25rem 1rem 3rem; }

.cd-grid {
  display: grid; grid-template-columns: 1fr; gap: 1rem;
}
@media (min-width: 900px) { .cd-grid { grid-template-columns: 360px 1fr; } }

.cd-left { display: flex; flex-direction: column; gap: 1rem; }

/* Portrait card */
.cd-portrait-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(180deg, #1a1130, #0e0820);
  border: 1.5px solid rgba(255,255,255,0.08);
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.cd-portrait-card.rarity-R { border-color: #60a5fa; box-shadow: 0 0 24px rgba(96,165,250,0.4), 0 8px 24px rgba(0,0,0,0.5); }
.cd-portrait-card.rarity-SR { border-color: #c084fc; box-shadow: 0 0 28px rgba(192,132,252,0.5), 0 8px 24px rgba(0,0,0,0.5); }
.cd-portrait-card.rarity-SSR { border-color: #fbbf24; box-shadow: 0 0 32px rgba(251,191,36,0.55), 0 8px 24px rgba(0,0,0,0.5); }
.cd-portrait-card.rarity-UR { border-color: #f87171; box-shadow: 0 0 36px rgba(248,113,113,0.65), 0 8px 24px rgba(0,0,0,0.5); }
.cd-portrait-img {
  width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block;
  filter: contrast(1.08) saturate(1.15);
}
.cd-portrait-grad {
  position: absolute; inset: auto 0 0 0; height: 35%;
  background: linear-gradient(to top, rgba(14,8,32,0.95), transparent);
}
.cd-portrait-top {
  position: absolute; top: 10px; left: 10px; right: 10px;
  display: flex; align-items: center; justify-content: space-between;
}
.cd-elem-pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.1em;
  font-weight: 700;
}
.cd-portrait-bot {
  position: absolute; bottom: 10px; left: 10px;
}
.cd-stage-chip {
  padding: 3px 8px;
  background: rgba(255, 107, 157, 0.85);
  border-radius: 3px;
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.15em;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

/* Lore card */
.cd-lore {
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, rgba(31,21,56,0.88), rgba(20,12,40,0.88));
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
}
.cd-section-eyebrow {
  font-family: 'Orbitron', monospace;
  font-size: 9.5px;
  letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.7);
  margin-bottom: 0.5rem;
}
.cd-lore-text { font-size: 0.88rem; line-height: 1.7; color: rgba(255,255,255,0.82); margin: 0; }
.cd-lore-src {
  margin-top: 0.7rem;
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.45);
  display: flex; gap: 0.4rem;
}
.cd-lore-src-label { color: rgba(255, 200, 230, 0.6); font-weight: 600; }

.cd-right { display: flex; flex-direction: column; gap: 0.8rem; }

/* Level card */
.cd-level-card {
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, rgba(251,191,36,0.15), rgba(146,64,14,0.1));
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 8px;
  box-shadow: 0 0 16px rgba(251, 191, 36, 0.15);
}
.cd-level-row {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 0.65rem;
}
.cd-level-display {
  display: flex; align-items: baseline; gap: 4px;
  font-family: 'Orbitron', monospace;
}
.cd-level-num {
  font-size: 2.4rem;
  font-weight: 900;
  color: #fde047;
  text-shadow: 0 0 16px rgba(253,224,71,0.7);
  line-height: 1;
}
.cd-level-max { color: rgba(255,255,255,0.4); font-size: 1rem; }
.cd-stage-display { text-align: right; }
.cd-stage-num {
  font-family: 'Orbitron', monospace;
  font-size: 1.5rem;
  font-weight: 900;
  color: #f9a8d4;
  text-shadow: 0 0 10px rgba(244,114,182,0.5);
}
.cd-stage-num span { color: rgba(255,255,255,0.4); font-size: 0.7rem; }

.cd-exp-bar {
  height: 8px;
  background: rgba(0,0,0,0.55);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.5) inset;
}
.cd-exp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #fde047 0%, #f59e0b 50%, #ea580c 100%);
  box-shadow: 0 0 10px #fbbf24;
  transition: width 0.5s ease;
}
.cd-exp-info {
  display: flex; justify-content: space-between;
  font-family: 'Orbitron', monospace;
  font-size: 9.5px;
  color: rgba(255,255,255,0.5);
  margin-top: 5px;
}

/* Stats grid */
.cd-stats-card {
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, rgba(31,21,56,0.88), rgba(20,12,40,0.88));
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
}
.cd-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.cd-stat-cell {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.55rem 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid;
  border-radius: 6px;
}
.cd-stat-icon {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.4);
  border-radius: 6px;
  flex-shrink: 0;
}
.cd-stat-label {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(255,255,255,0.55);
}
.cd-stat-val {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 1.05rem;
  color: white;
}

/* Skills */
.cd-skills-card {
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, rgba(31,21,56,0.88), rgba(20,12,40,0.88));
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
}
.cd-skills-list { display: flex; flex-direction: column; gap: 0.35rem; }
.cd-skill-row {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.55rem 0.7rem;
  background: rgba(255,255,255,0.04);
  border-left: 3px solid rgba(255,107,157,0.4);
  border-radius: 4px;
}
.skill-fire { border-left-color: #ff8c42; }
.skill-water { border-left-color: #60a5fa; }
.skill-wood { border-left-color: #4ade80; }
.skill-light { border-left-color: #fde68a; }
.skill-dark { border-left-color: #c084fc; }
.cd-skill-icon {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.35);
  border-radius: 4px;
  color: rgba(255,200,230,0.85);
  flex-shrink: 0;
}
.cd-skill-text { flex: 1; min-width: 0; }
.cd-skill-name { font-weight: 700; font-size: 0.88rem; }
.cd-skill-desc { font-size: 10.5px; color: rgba(255,255,255,0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cd-skill-mp {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  color: #60a5fa;
  font-size: 1rem;
  text-shadow: 0 0 6px rgba(96,165,250,0.6);
}
.cd-skill-mp small { font-size: 8px; color: rgba(255,255,255,0.4); margin-left: 1px; }

.cd-skill-next {
  display: flex; align-items: center; gap: 0.5rem;
  margin-top: 0.55rem;
  padding: 0.5rem 0.7rem;
  background: rgba(255, 107, 157, 0.1);
  border: 1px dashed rgba(255, 107, 157, 0.4);
  border-radius: 4px;
  font-size: 11px;
  color: rgba(255,255,255,0.75);
}
.cd-skill-next b { color: #f9a8d4; }

/* Evolutions */
.cd-evos { margin-top: 1.5rem; }
.cd-evos-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 0.7rem;
}
@media (max-width: 600px) { .cd-evos-grid { grid-template-columns: 1fr; } }

.cd-evo-card {
  position: relative;
  background: linear-gradient(180deg, #1a1130 0%, #0e0820 100%);
  border: 1.5px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.25s ease;
}
.cd-evo-card.rarity-R { border-color: rgba(96,165,250,0.5); }
.cd-evo-card.rarity-SR { border-color: rgba(192,132,252,0.6); }
.cd-evo-card.rarity-SSR { border-color: rgba(251,191,36,0.7); }
.cd-evo-card.rarity-UR { border-color: rgba(248,113,113,0.8); }
.cd-evo--locked { opacity: 0.45; filter: grayscale(0.6); }
.cd-evo-img { position: relative; }
.cd-evo-img img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; filter: contrast(1.08) saturate(1.15); }
.cd-evo-lock {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem;
  color: rgba(255,255,255,0.65);
  font-family: 'Orbitron', monospace;
  font-weight: 900;
}
.cd-evo-info { padding: 0.6rem 0.75rem 0.75rem; }
.cd-evo-stage {
  font-size: 0.92rem; font-weight: 800;
  display: flex; align-items: center; gap: 0.4rem;
}
.cd-evo-check {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 50%;
  color: white;
}
.cd-evo-desc {
  font-size: 11px;
  color: rgba(255,255,255,0.55);
  margin: 3px 0 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
