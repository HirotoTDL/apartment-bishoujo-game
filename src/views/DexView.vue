<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { CHARACTERS, type Rarity } from "../game/data/characters";
import { portraitForChar } from "../assets/placeholder";
import AnimatedBackground from "../components/AnimatedBackground.vue";
import Icon from "../components/Icon.vue";
import RarityStars from "../components/RarityStars.vue";

const player = usePlayerStore();
const router = useRouter();

const filterRarity = ref<Rarity | "ALL">("ALL");
const showUncaught = ref(true);

const visibleList = computed(() => {
  let list = [...CHARACTERS];
  if (filterRarity.value !== "ALL") list = list.filter(c => c.rarity === filterRarity.value);
  if (!showUncaught.value) list = list.filter(c => player.save!.charDexCaught[c.id]);
  const order: Record<Rarity, number> = { UR: 0, SSR: 1, SR: 2, R: 3, N: 4 };
  list.sort((a, b) => order[a.rarity] - order[b.rarity]);
  return list;
});

const stats = computed(() => {
  const total = CHARACTERS.length;
  const caught = Object.values(player.save!.charDexCaught).filter(Boolean).length;
  return { total, caught, pct: Math.round(caught / total * 100) };
});

const rarityStats = computed(() => {
  const order: Rarity[] = ["UR", "SSR", "SR", "R", "N"];
  return order.map(r => {
    const total = CHARACTERS.filter(c => c.rarity === r).length;
    const caught = CHARACTERS.filter(c => c.rarity === r && player.save!.charDexCaught[c.id]).length;
    return { r, total, caught };
  });
});

function isCaught(id: string) { return !!player.save!.charDexCaught[id]; }
const filterTabs: Array<Rarity | "ALL"> = ["ALL", "UR", "SSR", "SR", "R", "N"];

function caughtCharOf(id: string) {
  return player.save!.owned.find(o => o.charId === id);
}
function viewChar(id: string) {
  const owned = caughtCharOf(id);
  if (owned) router.push({ name: "character", params: { uid: owned.uid } });
}
</script>

<template>
  <div class="dex-root">
    <AnimatedBackground variant="cosmic" intensity="normal" />

    <header class="dex-header">
      <button class="dex-back" @click="router.push({ name: 'home' })">
        <Icon name="arrow-back" :size="16" />
      </button>
      <div class="flex-1">
        <div class="dex-eyebrow">APARTMENT ARCHIVE</div>
        <h2 class="dex-title">アパート図鑑</h2>
      </div>
      <div class="dex-progress">
        <div class="dex-progress-label">PROGRESS</div>
        <div class="dex-progress-val">
          <span>{{ stats.caught }}</span><small>/{{ stats.total }}</small>
        </div>
        <div class="dex-progress-pct">{{ stats.pct }}%</div>
      </div>
    </header>

    <main class="dex-main">
      <!-- Rarity breakdown -->
      <div class="rarity-breakdown">
        <div v-for="rs in rarityStats" :key="rs.r" class="rarity-stat" :class="`rs-${rs.r}`">
          <RarityStars :rarity="rs.r" :size="11" />
          <div class="rarity-stat-val">
            <span>{{ rs.caught }}</span><small>/{{ rs.total }}</small>
          </div>
        </div>
      </div>

      <div class="dex-toolbar">
        <div class="dex-tabs">
          <button v-for="r in filterTabs" :key="r"
            class="dex-tab" :class="filterRarity === r ? 'dex-tab--active' : ''"
            @click="filterRarity = r"
          >{{ r }}</button>
        </div>
        <label class="dex-toggle">
          <input type="checkbox" v-model="showUncaught" />
          <span>未捕獲も表示</span>
        </label>
      </div>

      <div class="dex-grid">
        <div v-for="c in visibleList" :key="c.id"
          class="dex-entry animate-fade-in-up"
          :class="[isCaught(c.id) ? 'dex-entry--caught' : 'dex-entry--uncaught', `dex-${c.rarity}`]"
          @click="isCaught(c.id) && viewChar(c.id)"
        >
          <!-- Top frame -->
          <div class="dex-frame-top">
            <RarityStars :rarity="c.rarity" :size="10" />
            <span class="dex-elem" :class="`elem-${c.element}`"><Icon :name="c.element" :size="11" /></span>
          </div>

          <div class="dex-portrait-wrap">
            <img v-if="isCaught(c.id)" :src="portraitForChar(c.id, c.name, c.rarity, c.element, 1)" class="dex-portrait" />
            <div v-else class="dex-silhouette">
              <Icon name="lock" :size="36" />
            </div>
            <div class="dex-portrait-grad"></div>
            <div v-if="!isCaught(c.id)" class="dex-locked-label">未発見</div>
          </div>

          <div class="dex-frame-bot">
            <div class="dex-name" :class="!isCaught(c.id) ? 'dex-name--locked' : ''">
              {{ isCaught(c.id) ? c.name : '???' }}
            </div>
            <div class="dex-src">{{ isCaught(c.id) ? c.apartmentSource : '——' }}</div>
            <div v-if="isCaught(c.id)" class="dex-lore">{{ c.lore }}</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dex-root { min-height: 100vh; color: white; }

.dex-header {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.95), rgba(15, 8, 30, 0.55));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky; top: 0; z-index: 20;
}
.dex-back {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  color: white;
}
.dex-eyebrow {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.7);
}
.dex-title { font-size: 1.25rem; font-weight: 800; }
.dex-progress { text-align: right; }
.dex-progress-label {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(255,255,255,0.5);
}
.dex-progress-val {
  font-family: 'Orbitron', monospace;
  font-size: 1.3rem;
  font-weight: 900;
}
.dex-progress-val span { color: #fde047; text-shadow: 0 0 12px rgba(253, 224, 71, 0.6); }
.dex-progress-val small { color: rgba(255,255,255,0.35); font-size: 0.8rem; }
.dex-progress-pct {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  color: rgba(255, 200, 230, 0.6);
}

.dex-main { max-width: 1200px; margin: 0 auto; padding: 1.25rem 0.85rem 3rem; }

/* Rarity breakdown */
.rarity-breakdown {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.rarity-stat {
  padding: 0.55rem 0.7rem;
  background: linear-gradient(135deg, rgba(31, 21, 56, 0.85), rgba(15, 8, 30, 0.85));
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  display: flex; flex-direction: column; gap: 0.3rem; align-items: flex-start;
}
.rs-UR { border-color: rgba(248, 113, 113, 0.4); }
.rs-SSR { border-color: rgba(251, 191, 36, 0.4); }
.rs-SR { border-color: rgba(192, 132, 252, 0.4); }
.rs-R { border-color: rgba(96, 165, 250, 0.4); }
.rarity-stat-val {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
}
.rarity-stat-val span { font-size: 1.15rem; color: white; }
.rarity-stat-val small { color: rgba(255,255,255,0.4); font-size: 0.75rem; }

/* Toolbar */
.dex-toolbar {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.65rem 0.85rem;
  background: rgba(31, 21, 56, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}
.dex-tabs { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.dex-tab {
  padding: 0.3rem 0.65rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-family: 'Orbitron', monospace;
  font-size: 11px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
}
.dex-tab:hover { background: rgba(255, 255, 255, 0.12); color: white; }
.dex-tab--active {
  background: linear-gradient(135deg, #ff6b9d, #c34dff);
  border-color: transparent;
  color: white;
  box-shadow: 0 0 12px rgba(255, 107, 157, 0.5);
}
.dex-toggle {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 11px;
  color: rgba(255, 200, 230, 0.7);
  cursor: pointer;
}

/* Dex grid */
.dex-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 0.7rem;
}

.dex-entry {
  position: relative;
  background: linear-gradient(180deg, #1a1130 0%, #0e0820 100%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(.2,.9,.3,1.4);
}
.dex-entry:hover { transform: translateY(-4px); }
.dex-entry--uncaught { cursor: default; }

.dex-N { border-color: rgba(148,163,184,0.3); }
.dex-R { box-shadow: 0 0 0 1px rgba(96,165,250,0.5), 0 0 12px rgba(96,165,250,0.25); background: linear-gradient(180deg, #1e3a8a 0%, #0e1530 100%); }
.dex-SR { box-shadow: 0 0 0 1px rgba(192,132,252,0.6), 0 0 16px rgba(192,132,252,0.35); background: linear-gradient(180deg, #6d28d9 0%, #1a0a36 100%); }
.dex-SSR { box-shadow: 0 0 0 1.5px rgba(251,191,36,0.7), 0 0 18px rgba(251,191,36,0.45); background: linear-gradient(180deg, #b45309 0%, #1a0a02 100%); }
.dex-UR { box-shadow: 0 0 0 2px rgba(248,113,113,0.8), 0 0 24px rgba(248,113,113,0.6); background: linear-gradient(180deg, #be123c 0%, #1a0808 100%); animation: dex-ur-pulse 2.5s ease-in-out infinite; }
@keyframes dex-ur-pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(248,113,113,0.8), 0 0 22px rgba(248,113,113,0.55); }
  50% { box-shadow: 0 0 0 2.2px rgba(251,191,36,0.85), 0 0 32px rgba(248,113,113,0.85); }
}
.dex-entry--uncaught { opacity: 0.38; filter: grayscale(0.5); }

.dex-frame-top {
  position: absolute; top: 6px; left: 6px; right: 6px;
  display: flex; justify-content: space-between; align-items: center;
  z-index: 5;
}
.dex-elem {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.15);
  color: white;
}

.dex-portrait-wrap {
  position: relative;
  width: 100%; aspect-ratio: 3/4;
  overflow: hidden;
}
.dex-portrait { width: 100%; height: 100%; object-fit: cover; filter: contrast(1.08) saturate(1.15); }
.dex-silhouette {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(0,0,0,0.5), rgba(20,14,38,0.7));
  color: rgba(255,255,255,0.15);
}
.dex-portrait-grad {
  position: absolute; inset: auto 0 0 0; height: 45%;
  background: linear-gradient(to top, rgba(14, 8, 32, 0.95), transparent);
}
.dex-locked-label {
  position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%);
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.4);
  padding: 2px 8px;
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 2px;
}

.dex-frame-bot { padding: 0.55rem 0.7rem 0.7rem; }
.dex-name {
  font-size: 0.9rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dex-name--locked { color: rgba(255,255,255,0.4); }
.dex-src {
  font-size: 10px;
  color: rgba(255, 200, 230, 0.55);
  margin-top: 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dex-lore {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 4px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.elem-fire   { background: linear-gradient(135deg, #ff8c42, #c2410c); box-shadow: 0 0 8px rgba(249, 115, 22, 0.6); }
.elem-water  { background: linear-gradient(135deg, #38bdf8, #1d4ed8); box-shadow: 0 0 8px rgba(56, 189, 248, 0.6); }
.elem-wood   { background: linear-gradient(135deg, #4ade80, #15803d); box-shadow: 0 0 8px rgba(74, 222, 128, 0.6); }
.elem-light  { background: linear-gradient(135deg, #fde68a, #d97706); box-shadow: 0 0 8px rgba(253, 230, 138, 0.7); }
.elem-dark   { background: linear-gradient(135deg, #c084fc, #4c1d95); box-shadow: 0 0 8px rgba(192, 132, 252, 0.6); }
</style>
