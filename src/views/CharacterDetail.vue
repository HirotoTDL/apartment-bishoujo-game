<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { CHARACTERS_BY_ID } from "../game/data/characters";
import { SKILLS, ELEMENT_LABEL } from "../game/data/skills";
import { effectiveStats, maxMP, expForNextLevel, learnedSkills } from "../game/growth";
import { portraitForChar } from "../assets/placeholder";
import AnimatedBackground from "../components/AnimatedBackground.vue";
import RarityFrame from "../components/RarityFrame.vue";

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

const elementSym: Record<string, string> = { fire: "🔥", water: "💧", wood: "🌿", light: "✨", dark: "🌙" };
const statItems = computed(() => [
  { label: "HP", val: `${char.value.hp}/${stats.value.hp}`, icon: "❤️", color: "#f87171" },
  { label: "MP", val: `${char.value.mp}/${mpMaxV.value}`, icon: "💧", color: "#60a5fa" },
  { label: "ATK", val: stats.value.atk, icon: "⚔️", color: "#fbbf24" },
  { label: "DEF", val: stats.value.def, icon: "🛡️", color: "#a78bfa" },
  { label: "MAG", val: stats.value.mag, icon: "✨", color: "#f472b6" },
  { label: "SPD", val: stats.value.spd, icon: "💨", color: "#34d399" },
]);
</script>

<template>
  <div class="char-root min-h-screen text-white">
    <AnimatedBackground :variant="(master.element as any) || 'cosmic'" intensity="normal" />

    <header class="char-header">
      <button class="btn-secondary text-sm" @click="router.back()">← 戻る</button>
      <div class="text-center">
        <div class="text-[10px] text-pink-200 tracking-widest font-tech">CHARACTER</div>
        <h2 class="text-xl font-bold text-game-shadow">{{ master.name }}</h2>
      </div>
      <span class="rarity-badge text-base" :class="`rarity-badge-${master.rarity}`">{{ master.rarity }}</span>
    </header>

    <main class="char-main">
      <div class="char-grid">
        <section>
          <RarityFrame :rarity="master.rarity" :interactive="false">
            <div class="portrait-block">
              <img :src="portraitForChar(master.id, master.name, master.rarity, master.element, char.stage)" class="portrait-img" />
              <div class="portrait-tag">
                <span class="elem-badge" :class="`elem-${master.element}`">{{ elementSym[master.element] }}</span>
                <span class="text-xs">{{ ELEMENT_LABEL[master.element] }}属性</span>
                <span class="ml-auto text-xs font-tech text-pink-200">第{{ char.stage }}形態</span>
              </div>
            </div>
          </RarityFrame>
          <div class="lore-card mt-3">
            <div class="text-[10px] text-pink-200 font-tech tracking-widest mb-1">LORE</div>
            <p class="text-sm leading-relaxed text-white/80">{{ master.lore }}</p>
            <div class="text-[10px] text-white/40 mt-2">由来: {{ master.apartmentSource }}</div>
          </div>
        </section>

        <section class="char-right">
          <div class="lv-card">
            <div class="flex items-baseline gap-3">
              <span class="text-[10px] font-tech text-white/55">LEVEL</span>
              <div class="font-tech text-4xl font-extrabold text-glow">{{ char.level }}</div>
              <span class="text-xs text-white/40 font-tech">/ 99</span>
              <span class="ml-auto text-xs text-white/50">第{{ char.stage }}形態</span>
            </div>
            <div class="exp-bar mt-2">
              <div class="exp-bar-fill" :style="{ width: (char.exp / expToNext * 100) + '%' }"></div>
            </div>
            <div class="flex justify-between text-[10px] text-white/50 font-tech mt-1">
              <span>EXP {{ char.exp }}</span>
              <span>→ NEXT {{ expToNext }}</span>
            </div>
          </div>

          <div class="stats-grid">
            <div v-for="s in statItems" :key="s.label" class="stat-item" :style="{ borderColor: s.color + '66' }">
              <span class="text-xl">{{ s.icon }}</span>
              <div class="flex-1 min-w-0">
                <div class="text-[10px] text-white/55 font-tech tracking-widest">{{ s.label }}</div>
                <div class="font-bold text-base tabular-nums">{{ s.val }}</div>
              </div>
            </div>
          </div>

          <div class="skills-card">
            <h4 class="section-title text-pink-200 mb-2">習得技</h4>
            <div class="space-y-1.5">
              <div v-for="sid in learned" :key="sid" class="skill-row">
                <div class="text-xl">{{ SKILLS[sid]?.kind === 'heal' ? '💚' : SKILLS[sid]?.kind === 'buff' ? '⬆' : elementSym[SKILLS[sid]?.element || 'light'] || '⚔' }}</div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-sm">{{ SKILLS[sid]?.name }}</div>
                  <div class="text-[10px] text-white/55 truncate">{{ SKILLS[sid]?.description }}</div>
                </div>
                <div v-if="SKILLS[sid]?.mpCost" class="text-blue-300 font-tech text-sm font-bold">{{ SKILLS[sid]?.mpCost }}<span class="text-[9px] text-white/40">MP</span></div>
              </div>
            </div>
            <div v-if="master.skillLearnset.some(l => l.lv > char.level)" class="mt-3 next-skill">
              次の習得: Lv {{ master.skillLearnset.find(l => l.lv > char.level)!.lv }} で
              <strong class="text-pink-300">{{ SKILLS[master.skillLearnset.find(l => l.lv > char.level)!.skill].name }}</strong>
            </div>
          </div>
        </section>
      </div>

      <section class="evolutions-section">
        <h4 class="section-title text-pink-200 mb-3">進化段階</h4>
        <div class="evolutions-grid">
          <div v-for="s in allStagePortraits" :key="s.stage" class="evo-card" :class="s.unlocked ? '' : 'evo-card--locked'">
            <RarityFrame :rarity="master.rarity" :interactive="false">
              <img :src="s.url" class="w-full block" />
            </RarityFrame>
            <div class="text-center mt-2">
              <div class="text-sm font-bold">第{{ s.stage }}形態</div>
              <div class="text-[10px] text-white/55 font-tech tracking-wider">{{ s.unlocked ? "✓ UNLOCKED" : `Lv ${s.unlockLv}` }}</div>
              <div class="text-[10px] text-white/55 mt-1 line-clamp-2">{{ s.desc }}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.char-header {
  display: flex; align-items: center; gap: 1rem; justify-content: space-between;
  padding: 0.75rem 1rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.85), rgba(15, 8, 30, 0.4));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  position: sticky; top: 0; z-index: 20;
}

.char-main { max-width: 1100px; margin: 0 auto; padding: 1.5rem 1rem; }

.char-grid {
  display: grid; grid-template-columns: 1fr; gap: 1.25rem;
}
@media (min-width: 900px) { .char-grid { grid-template-columns: 1fr 1.2fr; } }

.portrait-block { position: relative; }
.portrait-img { width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block; filter: contrast(1.05) saturate(1.1); }
.portrait-tag {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(to top, rgba(20,14,38,0.95), transparent);
}

.lore-card {
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, rgba(31,21,56,0.85), rgba(42,28,74,0.85));
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 0.6rem;
}

.char-right { display: flex; flex-direction: column; gap: 1rem; }

.lv-card {
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.06));
  border: 1px solid rgba(251,191,36,0.3);
  border-radius: 0.6rem;
  box-shadow: 0 0 16px rgba(251,191,36,0.1);
}
.exp-bar {
  height: 6px;
  background: rgba(0,0,0,0.5);
  border-radius: 3px;
  overflow: hidden;
}
.exp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #fde047, #f59e0b, #ea580c);
  box-shadow: 0 0 8px #fbbf24;
  transition: width 0.5s ease;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.stat-item {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.55rem 0.75rem;
  background: linear-gradient(135deg, rgba(31,21,56,0.85), rgba(42,28,74,0.85));
  border: 1px solid;
  border-radius: 0.5rem;
}

.skills-card {
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, rgba(31,21,56,0.85), rgba(42,28,74,0.85));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 0.6rem;
}
.section-title {
  font-size: 0.95rem; font-weight: 800;
  letter-spacing: 0.05em;
}
.skill-row {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  background: rgba(255,255,255,0.04);
  border-radius: 0.4rem;
  border-left: 3px solid rgba(255,107,157,0.3);
}
.next-skill {
  padding: 0.55rem 0.75rem;
  background: rgba(255,107,157,0.1);
  border: 1px dashed rgba(255,107,157,0.4);
  border-radius: 0.4rem;
  font-size: 11px;
  color: rgba(255,255,255,0.7);
}

.evolutions-section { margin-top: 1.5rem; }
.evolutions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.85rem;
}
.evo-card { transition: all 0.25s ease; }
.evo-card--locked { opacity: 0.35; filter: grayscale(0.7); }
</style>
