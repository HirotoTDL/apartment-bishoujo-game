<script setup lang="ts">
import { computed } from "vue";
import { usePlayerStore } from "../stores/player";
import AnimatedBackground from "../components/AnimatedBackground.vue";
import CharCard from "../components/CharCard.vue";

const player = usePlayerStore();

const menu = [
  { to: { name: "stages" }, label: "ストーリー", desc: "ステージを進める", icon: "🏘️", color: "from-pink-500 to-rose-500" },
  { to: { name: "party" }, label: "編成 / 育成", desc: "パーティ編成と進化", icon: "👥", color: "from-violet-500 to-indigo-500" },
  { to: { name: "dex" }, label: "図鑑", desc: "出会ったキャラ一覧", icon: "📖", color: "from-amber-500 to-yellow-500" },
  { to: { name: "shop" }, label: "ショップ", desc: "アイテム購入", icon: "🛍️", color: "from-emerald-500 to-teal-500" },
];

const summary = computed(() => {
  const s = player.save!;
  return {
    party: player.party.length,
    owned: s.owned.length,
    gold: s.currency.gold,
    cleared: s.clearedStages.length,
    battles: s.stats.battlesWon,
  };
});

const leadChar = computed(() => player.party[0] ?? null);

async function rest() {
  player.restAll();
  await player.persist();
}
</script>

<template>
  <div v-if="player.save" class="home-root min-h-screen text-white">
    <AnimatedBackground variant="cosmic" intensity="normal" />

    <!-- Top bar -->
    <header class="home-header">
      <div class="home-header-inner">
        <div class="flex items-center gap-3">
          <div class="home-avatar">
            <span class="text-2xl">🏠</span>
          </div>
          <div>
            <div class="text-[11px] text-pink-200/70 tracking-widest font-tech">WELCOME BACK</div>
            <h2 class="text-xl font-bold text-game-shadow">{{ player.save.displayName }}</h2>
          </div>
        </div>
        <div class="home-stats">
          <div class="home-stat home-stat--gold">
            <span class="home-stat-icon">💰</span>
            <div>
              <div class="home-stat-label">GOLD</div>
              <div class="home-stat-val">{{ summary.gold.toLocaleString() }}</div>
            </div>
          </div>
          <div class="home-stat">
            <span class="home-stat-icon">📚</span>
            <div>
              <div class="home-stat-label">COLLECTION</div>
              <div class="home-stat-val">{{ summary.owned }}/50</div>
            </div>
          </div>
          <div class="home-stat">
            <span class="home-stat-icon">🏆</span>
            <div>
              <div class="home-stat-label">CLEARED</div>
              <div class="home-stat-val">{{ summary.cleared }}</div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="home-main">
      <!-- Lead char banner -->
      <section v-if="leadChar" class="lead-banner panel-glow animate-fade-in-up">
        <div class="lead-banner-bg"></div>
        <div class="lead-banner-content">
          <div class="text-[11px] text-pink-200/80 tracking-widest font-tech mb-1">PARTY LEADER</div>
          <CharCard :char="leadChar" />
        </div>
        <div class="lead-banner-actions">
          <router-link :to="{ name: 'party' }" class="btn-secondary text-sm">編成変更</router-link>
          <button class="btn-secondary text-sm" @click="rest">💤 全回復</button>
        </div>
      </section>

      <!-- Menu grid -->
      <section class="menu-grid">
        <router-link
          v-for="(m, i) in menu"
          :key="m.label"
          :to="m.to"
          class="menu-card card-hover animate-fade-in-up"
          :style="{ animationDelay: `${0.05 + i * 0.08}s` }"
        >
          <div class="menu-card-icon" :class="'bg-gradient-to-br ' + m.color">
            <span class="text-4xl">{{ m.icon }}</span>
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-bold tracking-wide">{{ m.label }}</h3>
            <p class="text-white/60 text-xs">{{ m.desc }}</p>
          </div>
          <div class="menu-card-arrow">›</div>
        </router-link>
      </section>
    </main>

    <footer class="text-center text-xs text-white/30 pb-4 font-tech tracking-wider">
      AUTO-SAVE ENABLED · {{ summary.battles }} BATTLES WON
    </footer>
  </div>
</template>

<style scoped>
.home-root { padding-bottom: 2rem; }

.home-header {
  background: linear-gradient(180deg, rgba(20, 12, 40, 0.85), rgba(20, 12, 40, 0.4));
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0.75rem 1rem;
  position: sticky; top: 0; z-index: 30;
}
.home-header-inner {
  display: flex; justify-content: space-between; align-items: center; gap: 1rem;
  flex-wrap: wrap;
  max-width: 1200px; margin: 0 auto;
}
.home-avatar {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b9d, #c34dff);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 18px rgba(255, 107, 157, 0.5), 0 4px 12px rgba(0,0,0,0.4);
}

.home-stats { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.home-stat {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.home-stat--gold {
  border-color: rgba(251, 191, 36, 0.5);
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.08));
  box-shadow: 0 0 12px rgba(251, 191, 36, 0.2);
}
.home-stat-icon { font-size: 1.25rem; }
.home-stat-label { font-size: 9px; letter-spacing: 0.15em; color: rgba(255,255,255,0.5); font-family: 'Orbitron', monospace; }
.home-stat-val { font-weight: 700; font-size: 0.95rem; tabular-nums: true; }

.home-main {
  max-width: 1100px; margin: 0 auto;
  padding: 1.5rem 1rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 900px) {
  .home-main { grid-template-columns: 1.1fr 1fr; }
}

.lead-banner {
  position: relative;
  padding: 1.25rem;
  display: flex; flex-direction: column; gap: 0.85rem;
  overflow: hidden;
}
.lead-banner-bg {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at top right, rgba(255,107,157,0.25), transparent 60%);
  pointer-events: none;
}
.lead-banner-content { position: relative; z-index: 1; }
.lead-banner-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.menu-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
@media (min-width: 600px) {
  .menu-grid { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 900px) {
  .menu-grid { grid-template-columns: 1fr 1fr; }
}

.menu-card {
  display: flex; align-items: center; gap: 1rem;
  padding: 1.1rem 1.25rem;
  background: linear-gradient(135deg, rgba(31, 21, 56, 0.9), rgba(42, 28, 74, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  text-decoration: none;
  color: inherit;
  position: relative;
  overflow: hidden;
}
.menu-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,107,157,0.15), transparent 50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}
.menu-card:hover::before { opacity: 1; }

.menu-card-icon {
  width: 56px; height: 56px;
  border-radius: 0.875rem;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 16px currentColor, 0 6px 16px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.2) inset;
  flex-shrink: 0;
  filter: drop-shadow(0 0 4px rgba(0,0,0,0.5));
}
.menu-card-arrow {
  font-size: 2rem; font-weight: 200;
  color: rgba(255, 255, 255, 0.4);
  transition: transform 0.25s ease, color 0.25s ease;
}
.menu-card:hover .menu-card-arrow {
  color: white;
  transform: translateX(4px);
}
</style>
