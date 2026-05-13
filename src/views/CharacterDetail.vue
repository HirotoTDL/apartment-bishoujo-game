<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { CHARACTERS_BY_ID } from "../game/data/characters";
import { SKILLS, ELEMENT_LABEL } from "../game/data/skills";
import { effectiveStats, maxMP, expForNextLevel, learnedSkills } from "../game/growth";
import { portraitForChar } from "../assets/placeholder";
import ScenicBackground from "../components/ScenicBackground.vue";
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
    <ScenicBackground scene="sanctuary" />

    <header class="cd-header">
      <button class="cd-back" @click="router.back()"><Icon name="arrow-back" :size="14" /></button>
      <div>
        <div class="cd-eyebrow">CHARACTER</div>
        <h2 class="cd-title">{{ master.name }}</h2>
      </div>
      <div class="cd-rarity-wrap">
        <span class="cd-rarity-badge" :class="`rb-${master.rarity}`">{{ master.rarity }}</span>
      </div>
    </header>

    <main class="cd-main">
      <!-- Left: portrait -->
      <section class="cd-left">
        <div class="cd-portrait-card" :class="`rarity-${master.rarity}`">
          <img :src="portraitForChar(master.id, master.name, master.rarity, master.element, char.stage)" class="cd-portrait-img" />
          <div class="cd-portrait-grad"></div>
          <div class="cd-portrait-top">
            <RarityStars :rarity="master.rarity" :size="11" />
            <span class="cd-elem-pill" :class="`elem-${master.element}`">
              <Icon :name="master.element" :size="11" />
              <span>{{ ELEMENT_LABEL[master.element] }}</span>
            </span>
          </div>
          <div class="cd-portrait-bot">
            <div class="cd-stage-chip">EVO {{ char.stage }}</div>
          </div>
        </div>
        <div class="cd-lore">
          <div class="cd-section-eye">LORE</div>
          <p class="cd-lore-text">{{ master.lore }}</p>
          <div class="cd-lore-src">由来: {{ master.apartmentSource }}</div>
        </div>
      </section>

      <!-- Middle: level + stats -->
      <section class="cd-mid">
        <div class="cd-level-card">
          <div class="cd-level-row">
            <div>
              <div class="cd-section-eye">LEVEL</div>
              <div class="cd-lv">
                <span class="cd-lv-num">{{ char.level }}</span>
                <span class="cd-lv-max">/ 99</span>
              </div>
            </div>
            <div class="cd-stage-display">
              <div class="cd-section-eye">STAGE</div>
              <div class="cd-stage-num">{{ char.stage }} <span>/ 3</span></div>
            </div>
          </div>
          <div class="cd-exp-bar">
            <div class="cd-exp-fill" :style="{ width: (char.exp / expToNext * 100) + '%' }"></div>
          </div>
          <div class="cd-exp-info">
            <span>EXP {{ char.exp.toLocaleString() }}</span>
            <span>→ {{ expToNext.toLocaleString() }}</span>
          </div>
        </div>

        <div class="cd-stats-card">
          <div class="cd-section-eye">STATS</div>
          <div class="cd-stats-grid">
            <div v-for="s in statItems" :key="s.label" class="cd-stat" :style="{ borderColor: s.color + '4d' }">
              <span class="cd-stat-icon" :style="{ color: s.color }"><Icon :name="s.icon" :size="16" /></span>
              <div>
                <div class="cd-stat-label">{{ s.label }}</div>
                <div class="cd-stat-val">{{ s.val }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Right: skills + evolutions -->
      <section class="cd-right">
        <div class="cd-skills-card">
          <div class="cd-section-eye">SKILLS</div>
          <div class="cd-skills-scroll">
            <div v-for="sid in learned" :key="sid" class="cd-skill-row" :class="`skill-${SKILLS[sid]?.element || 'neutral'}`">
              <div class="cd-skill-icon"><Icon :name="skillIconFor(SKILLS[sid])" :size="14" /></div>
              <div class="cd-skill-text">
                <div class="cd-skill-name">{{ SKILLS[sid]?.name }}</div>
                <div class="cd-skill-desc">{{ SKILLS[sid]?.description }}</div>
              </div>
              <div v-if="SKILLS[sid]?.mpCost" class="cd-skill-mp"><span>{{ SKILLS[sid]?.mpCost }}</span><small>MP</small></div>
            </div>
          </div>
          <div v-if="master.skillLearnset.some(l => l.lv > char.level)" class="cd-skill-next">
            <Icon name="lock" :size="11" />
            <span>Lv {{ master.skillLearnset.find(l => l.lv > char.level)!.lv }} で
              <b>{{ SKILLS[master.skillLearnset.find(l => l.lv > char.level)!.skill].name }}</b>
            </span>
          </div>
        </div>

        <div class="cd-evos-card">
          <div class="cd-section-eye">EVOLUTIONS</div>
          <div class="cd-evos-grid">
            <div v-for="s in stagePortraits" :key="s.stage" class="cd-evo" :class="[s.unlocked ? 'cd-evo--open' : 'cd-evo--locked', `rarity-${master.rarity}`]">
              <div class="cd-evo-img">
                <img :src="s.url" />
                <div v-if="!s.unlocked" class="cd-evo-lock">
                  <Icon name="lock" :size="20" /><div>Lv {{ s.unlockLv }}</div>
                </div>
              </div>
              <div class="cd-evo-info">
                <div class="cd-evo-stage">第{{ s.stage }}形態 <span v-if="s.unlocked" class="cd-evo-check"><Icon name="check" :size="9" /></span></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.cd-root {
  position: absolute; inset: 0;
  overflow: hidden;
  color: white;
  display: flex; flex-direction: column;
}

.cd-header {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 0.9rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.92), rgba(15, 8, 30, 0.55));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
.cd-back {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 5px; color: white;
}
.cd-eyebrow { font-family: 'Orbitron', monospace; font-size: 9px; letter-spacing: 0.3em; color: rgba(255, 200, 230, 0.7); }
.cd-title { font-size: 1.1rem; font-weight: 800; margin: 1px 0 0; }
.cd-rarity-wrap { margin-left: auto; }
.cd-rarity-badge {
  font-family: 'Orbitron', monospace;
  font-size: 13px; font-weight: 900;
  padding: 4px 9px;
  border-radius: 4px;
  color: white;
  letter-spacing: 0.08em;
}
.rb-N { background: linear-gradient(135deg, #94a3b8, #475569); }
.rb-R { background: linear-gradient(135deg, #60a5fa, #1d4ed8); box-shadow: 0 0 10px rgba(96,165,250,0.4); }
.rb-SR { background: linear-gradient(135deg, #c084fc, #7c3aed); box-shadow: 0 0 12px rgba(192,132,252,0.5); }
.rb-SSR { background: linear-gradient(135deg, #fbbf24, #d97706); box-shadow: 0 0 14px rgba(251,191,36,0.6); }
.rb-UR { background: linear-gradient(135deg, #f87171, #be123c); box-shadow: 0 0 16px rgba(248,113,113,0.7); }

.cd-main {
  flex: 1; min-height: 0;
  padding: 0.85rem;
  display: grid;
  grid-template-columns: 280px 1fr 1fr;
  gap: 0.7rem;
}
@media (max-width: 900px) {
  .cd-main { grid-template-columns: 1fr; grid-template-rows: auto auto auto; overflow-y: auto; }
}

.cd-left, .cd-mid, .cd-right {
  display: flex; flex-direction: column; gap: 0.6rem;
  min-height: 0;
}

.cd-section-eye {
  font-family: 'Orbitron', monospace;
  font-size: 9px; letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.7);
  margin-bottom: 0.4rem;
}

/* Portrait */
.cd-portrait-card {
  position: relative;
  flex: 1; min-height: 0;
  border-radius: 10px;
  overflow: hidden;
  background: linear-gradient(180deg, #1a1130, #0e0820);
  border: 1.5px solid rgba(255,255,255,0.08);
  box-shadow: 0 6px 20px rgba(0,0,0,0.5);
}
.cd-portrait-card.rarity-R { border-color: #60a5fa; box-shadow: 0 0 20px rgba(96,165,250,0.4); }
.cd-portrait-card.rarity-SR { border-color: #c084fc; box-shadow: 0 0 24px rgba(192,132,252,0.5); }
.cd-portrait-card.rarity-SSR { border-color: #fbbf24; box-shadow: 0 0 28px rgba(251,191,36,0.55); }
.cd-portrait-card.rarity-UR { border-color: #f87171; box-shadow: 0 0 32px rgba(248,113,113,0.65); }
.cd-portrait-img {
  width: 100%; height: 100%; object-fit: cover;
  filter: contrast(1.08) saturate(1.15);
}
.cd-portrait-grad {
  position: absolute; inset: auto 0 0 0; height: 30%;
  background: linear-gradient(to top, rgba(14,8,32,0.95), transparent);
}
.cd-portrait-top {
  position: absolute; top: 8px; left: 8px; right: 8px;
  display: flex; align-items: center; justify-content: space-between;
}
.cd-elem-pill {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 6px;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 3px;
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.1em;
  font-weight: 700;
}
.cd-portrait-bot { position: absolute; bottom: 8px; left: 8px; }
.cd-stage-chip {
  padding: 2px 7px;
  background: rgba(255, 107, 157, 0.85);
  border-radius: 3px;
  font-family: 'Orbitron', monospace;
  font-size: 9px; font-weight: 900;
  letter-spacing: 0.15em;
  color: white;
}

.cd-lore {
  padding: 0.6rem 0.75rem;
  background: linear-gradient(135deg, rgba(31,21,56,0.88), rgba(20,12,40,0.88));
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 7px;
  flex-shrink: 0;
}
.cd-lore-text { font-size: 11.5px; line-height: 1.6; color: rgba(255,255,255,0.82); margin: 0; }
.cd-lore-src { margin-top: 0.4rem; font-size: 10px; color: rgba(255, 200, 230, 0.55); }

/* Mid */
.cd-level-card {
  padding: 0.65rem 0.85rem;
  background: linear-gradient(135deg, rgba(251,191,36,0.15), rgba(146,64,14,0.1));
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: 7px;
  flex-shrink: 0;
}
.cd-level-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 0.5rem; }
.cd-lv { display: flex; align-items: baseline; gap: 3px; font-family: 'Orbitron', monospace; }
.cd-lv-num { font-size: 1.9rem; font-weight: 900; color: #fde047; text-shadow: 0 0 14px rgba(253,224,71,0.7); line-height: 1; }
.cd-lv-max { color: rgba(255,255,255,0.4); font-size: 0.85rem; }
.cd-stage-display { text-align: right; }
.cd-stage-num { font-family: 'Orbitron', monospace; font-size: 1.2rem; font-weight: 900; color: #f9a8d4; text-shadow: 0 0 10px rgba(244,114,182,0.5); }
.cd-stage-num span { color: rgba(255,255,255,0.4); font-size: 0.65rem; }
.cd-exp-bar { height: 7px; background: rgba(0,0,0,0.55); border-radius: 4px; overflow: hidden; }
.cd-exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #fde047 0%, #f59e0b 50%, #ea580c 100%);
  box-shadow: 0 0 8px #fbbf24;
  transition: width 0.5s ease;
}
.cd-exp-info {
  display: flex; justify-content: space-between;
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  color: rgba(255,255,255,0.5);
  margin-top: 4px;
}

.cd-stats-card {
  padding: 0.65rem 0.85rem;
  background: linear-gradient(135deg, rgba(31,21,56,0.88), rgba(20,12,40,0.88));
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 7px;
  flex: 1; min-height: 0;
}
.cd-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; }
.cd-stat {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.4rem 0.55rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid;
  border-radius: 5px;
}
.cd-stat-icon {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.4);
  border-radius: 5px;
  flex-shrink: 0;
}
.cd-stat-label { font-family: 'Orbitron', monospace; font-size: 8px; letter-spacing: 0.2em; color: rgba(255,255,255,0.55); }
.cd-stat-val { font-family: 'Orbitron', monospace; font-weight: 900; font-size: 0.92rem; color: white; }

/* Right */
.cd-skills-card {
  padding: 0.65rem 0.85rem;
  background: linear-gradient(135deg, rgba(31,21,56,0.88), rgba(20,12,40,0.88));
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 7px;
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
}
.cd-skills-scroll {
  flex: 1; min-height: 0;
  overflow-y: auto;
  display: flex; flex-direction: column; gap: 0.3rem;
  padding-right: 0.2rem;
}
.cd-skills-scroll::-webkit-scrollbar { width: 4px; }
.cd-skills-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
.cd-skill-row {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  background: rgba(255,255,255,0.04);
  border-left: 3px solid rgba(255,107,157,0.4);
  border-radius: 3px;
}
.skill-fire { border-left-color: #ff8c42; }
.skill-water { border-left-color: #60a5fa; }
.skill-wood { border-left-color: #4ade80; }
.skill-light { border-left-color: #fde68a; }
.skill-dark { border-left-color: #c084fc; }
.cd-skill-icon {
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.35);
  border-radius: 3px;
  color: rgba(255,200,230,0.85);
  flex-shrink: 0;
}
.cd-skill-text { flex: 1; min-width: 0; }
.cd-skill-name { font-weight: 700; font-size: 0.78rem; }
.cd-skill-desc { font-size: 9.5px; color: rgba(255,255,255,0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cd-skill-mp {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  color: #60a5fa;
  font-size: 0.88rem;
  text-shadow: 0 0 6px rgba(96,165,250,0.6);
}
.cd-skill-mp small { font-size: 7px; color: rgba(255,255,255,0.4); margin-left: 1px; }

.cd-skill-next {
  display: flex; align-items: center; gap: 0.4rem;
  margin-top: 0.45rem;
  padding: 0.4rem 0.65rem;
  background: rgba(255, 107, 157, 0.1);
  border: 1px dashed rgba(255, 107, 157, 0.4);
  border-radius: 3px;
  font-size: 10px;
  color: rgba(255,255,255,0.75);
  flex-shrink: 0;
}
.cd-skill-next b { color: #f9a8d4; }

.cd-evos-card {
  padding: 0.65rem 0.85rem;
  background: linear-gradient(135deg, rgba(31,21,56,0.88), rgba(20,12,40,0.88));
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 7px;
  flex-shrink: 0;
}
.cd-evos-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; }
.cd-evo {
  background: linear-gradient(180deg, #1a1130 0%, #0e0820 100%);
  border: 1.5px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  overflow: hidden;
}
.cd-evo.rarity-R { border-color: rgba(96,165,250,0.5); }
.cd-evo.rarity-SR { border-color: rgba(192,132,252,0.6); }
.cd-evo.rarity-SSR { border-color: rgba(251,191,36,0.7); }
.cd-evo.rarity-UR { border-color: rgba(248,113,113,0.8); }
.cd-evo--locked { opacity: 0.45; filter: grayscale(0.6); }
.cd-evo-img { position: relative; aspect-ratio: 3/4; overflow: hidden; }
.cd-evo-img img { width: 100%; height: 100%; object-fit: cover; }
.cd-evo-lock {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem;
  color: rgba(255,255,255,0.65);
  font-family: 'Orbitron', monospace;
  font-size: 11px; font-weight: 900;
}
.cd-evo-info { padding: 0.35rem 0.5rem 0.5rem; }
.cd-evo-stage {
  font-size: 0.78rem; font-weight: 800;
  display: flex; align-items: center; gap: 0.3rem;
}
.cd-evo-check {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 50%;
  color: white;
}
</style>
