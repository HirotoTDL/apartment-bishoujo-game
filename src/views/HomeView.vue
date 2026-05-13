<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { usePlayerStore } from "../stores/player";
import ScenicBackground from "../components/ScenicBackground.vue";
import PortraitCard from "../components/PortraitCard.vue";
import Icon from "../components/Icon.vue";

const router = useRouter();
const route = useRoute();
const player = usePlayerStore();

const nav = [
  { to: { name: "home" },   label: "ホーム",   icon: "home" },
  { to: { name: "stages" }, label: "ステージ", icon: "map" },
  { to: { name: "party" },  label: "パーティ", icon: "users" },
  { to: { name: "dex" },    label: "図鑑",     icon: "book" },
  { to: { name: "shop" },   label: "ショップ", icon: "bag" },
];

const summary = computed(() => {
  const s = player.save!;
  return {
    party: player.party.length,
    owned: s.owned.length,
    gold: s.currency.gold,
    cleared: s.clearedStages.length,
    battles: s.stats.battlesWon,
    captureRate: s.stats.capturesAttempted > 0
      ? Math.round(s.stats.capturesSucceeded / s.stats.capturesAttempted * 100) : 0,
  };
});

const leadChar = computed(() => player.party[0] ?? null);
const dexProgress = computed(() => {
  const total = 50;
  const caught = Object.values(player.save!.charDexCaught).filter(Boolean).length;
  return { total, caught, pct: Math.round(caught / total * 100) };
});

const partySummary = computed(() => player.party);

async function rest() { player.restAll(); await player.persist(); }
function isActive(name: string) { return route.name === name; }
</script>

<template>
  <div v-if="player.save" class="home-root">
    <ScenicBackground scene="lobby" />

    <!-- LEFT SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-logo"><Icon name="sparkle" :size="20" /></div>
        <div>
          <div class="brand-name">HEARTFUL</div>
          <div class="brand-sub">GORION 仮</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <button v-for="item in nav" :key="item.label"
          class="nav-item" :class="isActive(item.to.name) && 'nav-item--active'"
          @click="router.push(item.to)"
        >
          <Icon :name="item.icon" :size="16" />
          <span>{{ item.label }}</span>
          <span v-if="isActive(item.to.name)" class="nav-marker"></span>
        </button>
      </nav>
      <div class="sidebar-foot">
        <div class="player-card">
          <div class="player-avatar"><Icon name="users" :size="16" /></div>
          <div class="min-w-0 flex-1">
            <div class="player-name">{{ player.save.displayName }}</div>
            <div class="player-rank">RANK F · Lv {{ Math.max(1, Math.floor(summary.battles / 5) + 1) }}</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- MAIN GRID -->
    <main class="content">
      <header class="header-row">
        <div>
          <div class="eyebrow">DASHBOARD</div>
          <h2 class="header-title">ようこそ、{{ player.save.displayName }}</h2>
        </div>
        <div class="header-actions">
          <button class="hbtn" @click="rest"><Icon name="sleep" :size="14" /><span>全回復</span></button>
          <button class="hbtn" @click="player.persist()"><Icon name="save" :size="14" /><span>セーブ</span></button>
        </div>
      </header>

      <!-- Stat strip -->
      <div class="stat-strip">
        <div class="stat-cell stat-cell--gold">
          <Icon name="gold" :size="22" />
          <div><div class="stat-label">GOLD</div><div class="stat-val">{{ summary.gold.toLocaleString() }}</div></div>
        </div>
        <div class="stat-cell">
          <Icon name="users" :size="20" />
          <div><div class="stat-label">所持</div><div class="stat-val">{{ summary.owned }}<small>/50</small></div></div>
        </div>
        <div class="stat-cell">
          <Icon name="book" :size="20" />
          <div><div class="stat-label">図鑑</div><div class="stat-val">{{ dexProgress.pct }}<small>%</small></div></div>
        </div>
        <div class="stat-cell">
          <Icon name="sword" :size="20" />
          <div><div class="stat-label">勝利</div><div class="stat-val">{{ summary.battles }}</div></div>
        </div>
        <div class="stat-cell">
          <Icon name="capture" :size="20" />
          <div><div class="stat-label">捕獲率</div><div class="stat-val">{{ summary.captureRate }}<small>%</small></div></div>
        </div>
      </div>

      <!-- Main grid -->
      <div class="main-grid">
        <!-- Lead card -->
        <section class="block block-lead">
          <div class="block-head">
            <span class="block-eyebrow">★ LEADER</span>
            <button class="block-link" @click="router.push({ name: 'party' })">
              編成<Icon name="arrow-right" :size="10" />
            </button>
          </div>
          <div class="lead-wrap">
            <PortraitCard v-if="leadChar" :char="leadChar" />
            <div v-else class="empty-lead">未編成</div>
          </div>
        </section>

        <!-- Quick actions -->
        <section class="block block-actions">
          <div class="block-head"><span class="block-eyebrow">▶ MENU</span></div>
          <button class="big-action" @click="router.push({ name: 'stages' })">
            <Icon name="map" :size="22" />
            <div><div class="big-action-name">ストーリー</div><div class="big-action-desc">ステージを進める</div></div>
            <Icon name="arrow-right" :size="14" class="big-action-arrow" />
          </button>
          <button class="big-action" @click="router.push({ name: 'party' })">
            <Icon name="users" :size="22" />
            <div><div class="big-action-name">編成 / 育成</div><div class="big-action-desc">パーティ管理</div></div>
            <Icon name="arrow-right" :size="14" class="big-action-arrow" />
          </button>
          <button class="big-action" @click="router.push({ name: 'dex' })">
            <Icon name="book" :size="22" />
            <div><div class="big-action-name">図鑑</div><div class="big-action-desc">{{ dexProgress.caught }}/{{ dexProgress.total }} 収集</div></div>
            <Icon name="arrow-right" :size="14" class="big-action-arrow" />
          </button>
          <button class="big-action" @click="router.push({ name: 'shop' })">
            <Icon name="bag" :size="22" />
            <div><div class="big-action-name">ショップ</div><div class="big-action-desc">アイテム購入</div></div>
            <Icon name="arrow-right" :size="14" class="big-action-arrow" />
          </button>
        </section>

        <!-- Party strip -->
        <section class="block block-party">
          <div class="block-head">
            <span class="block-eyebrow">◆ 現在のパーティ ({{ summary.party }}/4)</span>
            <button class="block-link" @click="router.push({ name: 'party' })">
              全員<Icon name="arrow-right" :size="10" />
            </button>
          </div>
          <div class="party-strip">
            <div v-for="(c, idx) in partySummary" :key="c.uid"
              class="party-slot"
              @click="router.push({ name: 'character', params: { uid: c.uid } })">
              <PortraitCard :char="c" :show-stats="false" />
              <div class="party-num">{{ idx + 1 }}</div>
            </div>
            <div v-for="i in (4 - partySummary.length)" :key="'e' + i" class="party-empty">
              <Icon name="users" :size="22" /><span>EMPTY</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-root {
  position: absolute;
  inset: 0;
  overflow: hidden;
  color: white;
  display: grid;
  grid-template-columns: 200px 1fr;
}

/* SIDEBAR */
.sidebar {
  height: 100%;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.92), rgba(10, 5, 20, 0.92));
  backdrop-filter: blur(16px);
  border-right: 1px solid rgba(255, 200, 230, 0.1);
  display: flex; flex-direction: column;
  padding: 10px 0 0;
}
.sidebar-brand {
  padding: 0 1rem 1rem;
  display: flex; align-items: center; gap: 0.65rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.brand-logo {
  width: 36px; height: 36px;
  border-radius: 7px;
  background: linear-gradient(135deg, #ff6b9d, #c34dff);
  display: flex; align-items: center; justify-content: center;
  color: white;
  box-shadow: 0 0 14px rgba(255,107,157,0.55), 0 3px 10px rgba(0,0,0,0.4);
}
.brand-name {
  font-family: 'Orbitron', monospace;
  font-size: 12px; font-weight: 900; letter-spacing: 0.15em;
}
.brand-sub {
  font-family: 'Orbitron', monospace;
  font-size: 8px; letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.55);
}
.sidebar-nav {
  flex: 1;
  margin-top: 1rem;
  padding: 0 0.5rem;
  display: flex; flex-direction: column; gap: 0.15rem;
  overflow-y: auto;
}
.nav-item {
  position: relative;
  display: flex; align-items: center; gap: 0.65rem;
  padding: 0.6rem 0.8rem;
  border-radius: 7px;
  color: rgba(255, 255, 255, 0.65);
  font-weight: 600; font-size: 0.85rem;
  transition: all 0.2s ease;
}
.nav-item:hover { background: rgba(255, 255, 255, 0.05); color: white; }
.nav-item--active {
  background: linear-gradient(135deg, rgba(255,107,157,0.18), rgba(157,107,255,0.12));
  color: white;
}
.nav-marker {
  position: absolute; left: -0.5rem; top: 50%; transform: translateY(-50%);
  width: 3px; height: 60%;
  background: linear-gradient(180deg, #ff6b9d, #c34dff);
  border-radius: 0 3px 3px 0;
  box-shadow: 0 0 8px rgba(255,107,157,0.7);
}
.sidebar-foot {
  padding: 0.6rem 0.6rem 0.6rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}
.player-card {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
}
.player-avatar {
  width: 30px; height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b9d, #c34dff);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.player-name { font-size: 12px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.player-rank {
  font-family: 'Orbitron', monospace;
  font-size: 8px; letter-spacing: 0.15em;
  color: rgba(255, 200, 230, 0.7);
}

/* CONTENT */
.content {
  height: 100%;
  padding: 10px 16px;
  display: flex; flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.header-row {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 0.5rem;
}
.eyebrow {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.65);
}
.header-title {
  font-size: 20px;
  font-weight: 800; margin: 1px 0 0;
}
.header-actions { display: flex; gap: 0.35rem; }
.hbtn {
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.4rem 0.75rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 5px;
  color: rgba(255,255,255,0.85);
  font-size: 0.8rem;
}
.hbtn:hover {
  background: rgba(255,107,157,0.18);
  border-color: rgba(255,107,157,0.5);
}

/* Stat strip */
.stat-strip {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}
.stat-cell {
  display: flex; align-items: center; gap: 0.55rem;
  padding: 0.55rem 0.7rem;
  background: linear-gradient(135deg, rgba(31, 21, 56, 0.88), rgba(42, 28, 74, 0.88));
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}
.stat-cell--gold {
  background: linear-gradient(135deg, rgba(180, 83, 9, 0.4), rgba(146, 64, 14, 0.3));
  border-color: rgba(251, 191, 36, 0.5);
}
.stat-label {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.55);
}
.stat-val {
  font-family: 'Orbitron', monospace;
  font-size: 18px;
  font-weight: 900;
}
.stat-val small { color: rgba(255,255,255,0.4); font-size: 0.7em; font-weight: 700; }

/* Main grid */
.main-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: minmax(0, 1fr) 210px;
  gap: 0.7rem;
  grid-template-areas: "lead actions" "party party";
  min-height: 0;
}

.block {
  background: linear-gradient(135deg, rgba(31, 21, 56, 0.82), rgba(20, 12, 40, 0.82));
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 0.75rem;
  display: flex; flex-direction: column;
  min-height: 0;
}
.block-lead { grid-area: lead; }
.block-actions { grid-area: actions; gap: 0.35rem; }
.block-party { grid-area: party; }

.block-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.5rem;
}
.block-eyebrow {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.25em;
  color: rgba(255, 200, 230, 0.8);
}
.block-link {
  display: flex; align-items: center; gap: 0.2rem;
  padding: 0.2rem 0.5rem;
  font-size: 10px;
  color: rgba(255,255,255,0.6);
  border-radius: 3px;
}
.block-link:hover { background: rgba(255,107,157,0.18); color: white; }

.lead-wrap {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  min-height: 0;
  overflow: hidden;
}
.lead-wrap > * {
  height: 100%;
  width: 100%;
  max-width: 100%;
}
/* Constrain PortraitCard inside the lead area to fill its parent height
   rather than driving its size with aspect-ratio. */
.lead-wrap :deep(.pcard) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.lead-wrap :deep(.pcard-portrait) {
  flex: 1;
  aspect-ratio: auto;
  min-height: 0;
}
.lead-wrap :deep(.pcard-portrait img) {
  height: 100%;
  width: 100%;
  object-fit: cover;
}
.empty-lead {
  width: 100%;
  text-align: center;
  padding: 2rem 1rem;
  color: rgba(255, 255, 255, 0.4);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.big-action {
  display: flex; align-items: center; gap: 0.65rem;
  padding: 0.65rem 0.85rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
  color: white;
  transition: all 0.25s ease;
  position: relative;
  text-align: left;
}
.big-action:hover {
  background: linear-gradient(135deg, rgba(255,107,157,0.15), rgba(255,255,255,0.04));
  border-color: rgba(255, 107, 157, 0.4);
  transform: translateX(3px);
}
.big-action-name {
  font-size: 15px;
  font-weight: 700;
}
.big-action-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}
.big-action-arrow {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.4);
  transition: transform 0.25s ease;
}
.big-action:hover .big-action-arrow { color: white; transform: translateX(3px); }

.party-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.party-slot {
  position: relative; cursor: pointer;
  min-height: 0; min-width: 0;
  height: 100%;
  display: flex; flex-direction: column;
}
/* Inside the home party strip, force PortraitCard to fit the row height */
.party-strip :deep(.pcard) {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.party-strip :deep(.pcard-portrait) {
  flex: 1;
  aspect-ratio: auto;
  min-height: 0;
}
.party-strip :deep(.pcard-portrait img) {
  height: 100%;
  width: 100%;
  object-fit: cover;
}
.party-num {
  position: absolute; top: -5px; left: -5px;
  width: 22px; height: 22px;
  background: linear-gradient(135deg, #ff6b9d, #c34dff);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Orbitron', monospace;
  font-size: 11px; font-weight: 900;
  color: white; z-index: 10;
  box-shadow: 0 0 10px rgba(255, 107, 157, 0.6);
}
.party-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.3rem;
  height: 100%;
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.25);
  font-family: 'Orbitron', monospace;
  font-size: 9px; letter-spacing: 0.25em;
}
</style>
