<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { usePlayerStore } from "../stores/player";
import AnimatedBackground from "../components/AnimatedBackground.vue";
import PortraitCard from "../components/PortraitCard.vue";
import Icon from "../components/Icon.vue";
import { CHARACTERS_BY_ID } from "../game/data/characters";

const router = useRouter();
const route = useRoute();
const player = usePlayerStore();

const nav = [
  { to: { name: "home" },   label: "ホーム",   icon: "home",  short: "HOME" },
  { to: { name: "stages" }, label: "ステージ", icon: "map",   short: "STAGE" },
  { to: { name: "party" },  label: "パーティ", icon: "users", short: "PARTY" },
  { to: { name: "dex" },    label: "図鑑",     icon: "book",  short: "DEX" },
  { to: { name: "shop" },   label: "ショップ", icon: "bag",   short: "SHOP" },
];

const summary = computed(() => {
  const s = player.save!;
  return {
    party: player.party.length,
    owned: s.owned.length,
    gold: s.currency.gold,
    cleared: s.clearedStages.length,
    battles: s.stats.battlesWon,
    capturesSuccess: s.stats.capturesSucceeded,
    captureRate: s.stats.capturesAttempted > 0
      ? Math.round(s.stats.capturesSucceeded / s.stats.capturesAttempted * 100)
      : 0,
  };
});

const leadChar = computed(() => player.party[0] ?? null);
const dexProgress = computed(() => {
  const total = 50;
  const caught = Object.values(player.save!.charDexCaught).filter(Boolean).length;
  return { total, caught, pct: Math.round(caught / total * 100) };
});

const partySummary = computed(() => player.party.map(c => ({ char: c, master: CHARACTERS_BY_ID[c.charId] })));

async function rest() {
  player.restAll();
  await player.persist();
}

function isActive(name: string) { return route.name === name; }
</script>

<template>
  <div v-if="player.save" class="home-root">
    <AnimatedBackground variant="cosmic" intensity="normal" />

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-logo">
          <Icon name="sparkle" :size="22" />
        </div>
        <div>
          <div class="brand-name">HEARTFUL</div>
          <div class="brand-sub">GORION (仮)</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in nav" :key="item.short"
          class="nav-item" :class="isActive(item.to.name) && 'nav-item--active'"
          @click="router.push(item.to)"
        >
          <Icon :name="item.icon" :size="18" />
          <span>{{ item.label }}</span>
          <span v-if="isActive(item.to.name)" class="nav-marker"></span>
        </button>
      </nav>

      <div class="sidebar-foot">
        <div class="player-card">
          <div class="player-avatar">
            <Icon name="users" :size="18" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="player-name">{{ player.save.displayName }}</div>
            <div class="player-rank">RANK F · Lv {{ Math.max(1, Math.floor(summary.battles / 5) + 1) }}</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <main class="content">
      <header class="content-header">
        <div>
          <div class="content-eyebrow">DASHBOARD</div>
          <h2 class="content-title">本日もよろしくお願いします</h2>
        </div>
        <div class="content-actions">
          <button class="hbtn" @click="rest" title="パーティ全回復">
            <Icon name="sleep" :size="16" />
            <span>全回復</span>
          </button>
          <button class="hbtn" @click="player.persist()" title="セーブ">
            <Icon name="save" :size="16" />
            <span>セーブ</span>
          </button>
        </div>
      </header>

      <!-- Stat strip -->
      <section class="stat-strip">
        <div class="stat-cell stat-cell--gold">
          <Icon name="gold" :size="28" />
          <div>
            <div class="stat-cell-label">GOLD</div>
            <div class="stat-cell-val">{{ summary.gold.toLocaleString() }}</div>
          </div>
        </div>
        <div class="stat-cell">
          <Icon name="users" :size="24" />
          <div>
            <div class="stat-cell-label">所持キャラ</div>
            <div class="stat-cell-val">{{ summary.owned }}<span class="text-base text-white/40">/50</span></div>
          </div>
        </div>
        <div class="stat-cell">
          <Icon name="book" :size="24" />
          <div>
            <div class="stat-cell-label">図鑑進行</div>
            <div class="stat-cell-val">{{ dexProgress.pct }}<span class="text-base text-white/40">%</span></div>
          </div>
        </div>
        <div class="stat-cell">
          <Icon name="sword" :size="24" />
          <div>
            <div class="stat-cell-label">勝利数</div>
            <div class="stat-cell-val">{{ summary.battles }}</div>
          </div>
        </div>
        <div class="stat-cell">
          <Icon name="capture" :size="24" />
          <div>
            <div class="stat-cell-label">捕獲率</div>
            <div class="stat-cell-val">{{ summary.captureRate }}<span class="text-base text-white/40">%</span></div>
          </div>
        </div>
      </section>

      <!-- Main grid -->
      <section class="main-grid">
        <!-- Lead party showcase -->
        <div class="card-block card-block--lead">
          <div class="block-header">
            <span class="block-eyebrow">★ PARTY LEADER</span>
            <button class="block-action" @click="router.push({ name: 'party' })">
              編成変更 <Icon name="arrow-right" :size="12" />
            </button>
          </div>
          <PortraitCard v-if="leadChar" :char="leadChar" />
          <div v-else class="empty-lead">パーティが未編成です</div>
        </div>

        <!-- Quick actions / Party row -->
        <div class="card-block card-block--actions">
          <div class="block-header">
            <span class="block-eyebrow">▶ QUICK ACTIONS</span>
          </div>
          <button class="big-action big-action--story" @click="router.push({ name: 'stages' })">
            <Icon name="map" :size="32" />
            <div>
              <div class="big-action-title">ストーリー</div>
              <div class="big-action-desc">ステージを進めて新キャラを仲間に</div>
            </div>
            <Icon name="arrow-right" :size="20" class="big-action-arrow" />
          </button>
          <button class="big-action big-action--party" @click="router.push({ name: 'party' })">
            <Icon name="users" :size="32" />
            <div>
              <div class="big-action-title">編成 / 育成</div>
              <div class="big-action-desc">パーティを組んで進化させる</div>
            </div>
            <Icon name="arrow-right" :size="20" class="big-action-arrow" />
          </button>
          <button class="big-action big-action--dex" @click="router.push({ name: 'dex' })">
            <Icon name="book" :size="32" />
            <div>
              <div class="big-action-title">アパート図鑑</div>
              <div class="big-action-desc">{{ dexProgress.caught }}/{{ dexProgress.total }} 体収集済</div>
            </div>
            <Icon name="arrow-right" :size="20" class="big-action-arrow" />
          </button>
          <button class="big-action big-action--shop" @click="router.push({ name: 'shop' })">
            <Icon name="bag" :size="32" />
            <div>
              <div class="big-action-title">ショップ</div>
              <div class="big-action-desc">契約書とアイテムを購入</div>
            </div>
            <Icon name="arrow-right" :size="20" class="big-action-arrow" />
          </button>
        </div>

        <!-- Party row -->
        <div class="card-block card-block--row">
          <div class="block-header">
            <span class="block-eyebrow">◆ 現在のパーティ ({{ summary.party }}/4)</span>
            <button class="block-action" @click="router.push({ name: 'party' })">
              全員見る <Icon name="arrow-right" :size="12" />
            </button>
          </div>
          <div class="party-strip">
            <div
              v-for="(item, idx) in partySummary" :key="item.char.uid"
              class="party-strip-slot"
              @click="router.push({ name: 'character', params: { uid: item.char.uid } })"
            >
              <PortraitCard :char="item.char" :show-stats="false" />
              <div class="party-slot-num">{{ idx + 1 }}</div>
            </div>
            <div v-for="i in (4 - partySummary.length)" :key="'pe' + i" class="party-strip-empty">
              <Icon name="users" :size="24" />
              <span>空き</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home-root {
  min-height: 100vh;
  color: white;
  display: grid;
  grid-template-columns: 220px 1fr;
}
@media (max-width: 900px) {
  .home-root { grid-template-columns: 1fr; }
  .sidebar { display: none; }
}

/* === SIDEBAR === */
.sidebar {
  position: sticky; top: 0; height: 100vh;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.92), rgba(10, 5, 20, 0.92));
  backdrop-filter: blur(16px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  display: flex; flex-direction: column;
  padding: 1.5rem 0;
  overflow-y: auto;
}

.sidebar-brand {
  padding: 0 1.25rem 1.5rem;
  display: flex; align-items: center; gap: 0.7rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.brand-logo {
  width: 42px; height: 42px;
  border-radius: 8px;
  background: linear-gradient(135deg, #ff6b9d, #c34dff);
  display: flex; align-items: center; justify-content: center;
  color: white;
  box-shadow: 0 0 16px rgba(255,107,157,0.55), 0 4px 12px rgba(0,0,0,0.4);
}
.brand-name {
  font-family: 'Orbitron', monospace;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.15em;
  color: white;
}
.brand-sub {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.55);
}

.sidebar-nav {
  flex: 1;
  margin-top: 1.25rem;
  padding: 0 0.6rem;
  display: flex; flex-direction: column; gap: 0.2rem;
}
.nav-item {
  position: relative;
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 600; font-size: 0.92rem;
  letter-spacing: 0.03em;
  transition: all 0.2s ease;
  background: transparent;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 200, 230, 0.95);
}
.nav-item--active {
  background: linear-gradient(135deg, rgba(255,107,157,0.18), rgba(157,107,255,0.12));
  color: white;
  box-shadow: 0 0 0 1px rgba(255,107,157,0.4), 0 4px 12px rgba(0,0,0,0.3);
}
.nav-marker {
  position: absolute;
  left: -0.6rem; top: 50%; transform: translateY(-50%);
  width: 3px; height: 60%;
  background: linear-gradient(180deg, #ff6b9d, #c34dff);
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 8px rgba(255,107,157,0.7);
}

.sidebar-foot {
  padding: 0.85rem 0.85rem 0.3rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.player-card {
  display: flex; align-items: center; gap: 0.65rem;
  padding: 0.65rem 0.75rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}
.player-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b9d, #c34dff);
  display: flex; align-items: center; justify-content: center;
  color: white;
  flex-shrink: 0;
}
.player-name { font-size: 13px; font-weight: 700; color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.player-rank {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.15em;
  color: rgba(255, 200, 230, 0.7);
}

/* === CONTENT === */
.content {
  padding: 1.5rem 1.5rem 3rem;
  max-width: 1100px;
}
@media (max-width: 900px) { .content { padding: 1rem; } }

.content-header {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}
.content-eyebrow {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.65);
}
.content-title {
  font-size: 1.4rem;
  font-weight: 800;
  text-shadow: 0 2px 0 rgba(0,0,0,0.4);
  margin: 2px 0 0;
}
.content-actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.hbtn {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  color: rgba(255,255,255,0.85);
  font-size: 0.85rem;
  transition: all 0.2s ease;
}
.hbtn:hover {
  background: rgba(255, 107, 157, 0.18);
  border-color: rgba(255, 107, 157, 0.5);
  color: white;
}

/* Stat strip */
.stat-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.6rem;
  margin-bottom: 1.5rem;
}
.stat-cell {
  display: flex; align-items: center; gap: 0.7rem;
  padding: 0.85rem 0.95rem;
  background: linear-gradient(135deg, rgba(31, 21, 56, 0.9), rgba(42, 28, 74, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  color: rgba(255, 200, 230, 0.85);
}
.stat-cell--gold {
  background: linear-gradient(135deg, rgba(180, 83, 9, 0.4), rgba(146, 64, 14, 0.3));
  border-color: rgba(251, 191, 36, 0.5);
  box-shadow: 0 0 16px rgba(251, 191, 36, 0.15);
  color: #fde68a;
}
.stat-cell-label {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.55);
}
.stat-cell-val {
  font-family: 'Orbitron', monospace;
  font-size: 1.5rem;
  font-weight: 900;
  color: white;
  text-shadow: 0 0 12px currentColor;
}

/* Main grid */
.main-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  grid-template-rows: auto auto;
  gap: 1rem;
  grid-template-areas:
    "lead actions"
    "row row";
}
@media (max-width: 800px) {
  .main-grid {
    grid-template-columns: 1fr;
    grid-template-areas: "lead" "actions" "row";
  }
}

.card-block {
  background: linear-gradient(135deg, rgba(31, 21, 56, 0.85), rgba(20, 12, 40, 0.85));
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 1rem;
}
.card-block--lead { grid-area: lead; }
.card-block--actions { grid-area: actions; display: flex; flex-direction: column; gap: 0.6rem; }
.card-block--row { grid-area: row; }

.block-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.85rem;
}
.block-eyebrow {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.25em;
  color: rgba(255, 200, 230, 0.8);
}
.block-action {
  display: flex; align-items: center; gap: 0.25rem;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}
.block-action:hover { color: white; background: rgba(255, 107, 157, 0.18); }

.empty-lead {
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(255, 255, 255, 0.4);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.big-action {
  position: relative;
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.95rem 1.1rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: white;
  text-align: left;
  transition: all 0.25s ease;
  overflow: hidden;
}
.big-action::before {
  content: '';
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #ff6b9d, #c34dff);
  opacity: 0;
  transition: opacity 0.25s ease;
}
.big-action:hover {
  background: linear-gradient(135deg, rgba(255,107,157,0.15), rgba(255,255,255,0.04));
  border-color: rgba(255, 107, 157, 0.4);
  transform: translateX(4px);
}
.big-action:hover::before { opacity: 1; }
.big-action--story { color: #ffcce0; }
.big-action--party { color: #d6c4ff; }
.big-action--dex   { color: #fde68a; }
.big-action--shop  { color: #a7f3d0; }
.big-action-title { font-size: 1rem; font-weight: 700; color: white; }
.big-action-desc { font-size: 11px; color: rgba(255, 255, 255, 0.55); }
.big-action-arrow {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.4);
  transition: transform 0.25s ease;
}
.big-action:hover .big-action-arrow { color: white; transform: translateX(4px); }

.party-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.6rem;
}
@media (max-width: 600px) {
  .party-strip { grid-template-columns: 1fr 1fr; }
}
.party-strip-slot {
  position: relative;
}
.party-slot-num {
  position: absolute;
  top: -6px; left: -6px;
  width: 26px; height: 26px;
  background: linear-gradient(135deg, #ff6b9d, #c34dff);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Orbitron', monospace;
  font-size: 12px;
  font-weight: 900;
  color: white;
  z-index: 10;
  box-shadow: 0 0 12px rgba(255, 107, 157, 0.6);
}
.party-strip-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem;
  aspect-ratio: 3/5;
  border: 2px dashed rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.85rem;
}
</style>
