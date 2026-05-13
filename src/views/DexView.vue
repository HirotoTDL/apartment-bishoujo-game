<script setup lang="ts">
import { computed, ref } from "vue";
import { usePlayerStore } from "../stores/player";
import { CHARACTERS, type Rarity } from "../game/data/characters";
import { portraitForChar } from "../assets/placeholder";
import AnimatedBackground from "../components/AnimatedBackground.vue";
import RarityFrame from "../components/RarityFrame.vue";

const player = usePlayerStore();

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

function isCaught(id: string) { return !!player.save!.charDexCaught[id]; }

const elementSym: Record<string, string> = { fire: "🔥", water: "💧", wood: "🌿", light: "✨", dark: "🌙" };
const filterTabs: Array<Rarity | "ALL"> = ["ALL", "UR", "SSR", "SR", "R", "N"];
</script>

<template>
  <div class="dex-root min-h-screen text-white">
    <AnimatedBackground variant="cosmic" intensity="normal" />

    <header class="dex-header">
      <button class="btn-secondary text-sm" @click="$router.push({ name: 'home' })">← ホームへ</button>
      <div class="text-center">
        <h2 class="text-xl font-bold text-game-shadow">アパート図鑑</h2>
        <div class="text-[10px] text-pink-200 font-tech tracking-widest">COLLECTION</div>
      </div>
      <div class="text-right">
        <div class="text-[10px] text-white/50 font-tech">PROGRESS</div>
        <div class="font-tech text-base font-bold">
          <span class="text-pink-300">{{ stats.caught }}</span><span class="text-white/40">/</span>{{ stats.total }}
          <span class="text-yellow-300 text-xs ml-1">{{ stats.pct }}%</span>
        </div>
      </div>
    </header>

    <main class="dex-main">
      <div class="dex-controls">
        <div class="dex-tabs">
          <button v-for="r in filterTabs" :key="r"
            class="dex-tab" :class="filterRarity === r ? 'dex-tab--active' : ''"
            @click="filterRarity = r"
          >{{ r }}</button>
        </div>
        <label class="text-xs flex items-center gap-1.5 cursor-pointer select-none">
          <input type="checkbox" v-model="showUncaught" />
          未捕獲も表示
        </label>
      </div>

      <div class="dex-grid">
        <div v-for="c in visibleList" :key="c.id" class="dex-entry animate-fade-in-up"
          :class="isCaught(c.id) ? '' : 'dex-entry--uncaught'">
          <RarityFrame :rarity="c.rarity" :interactive="false">
            <div class="dex-card">
              <div class="absolute top-1.5 left-1.5 flex gap-1 z-10">
                <span class="rarity-badge" :class="`rarity-badge-${c.rarity}`">{{ c.rarity }}</span>
                <span class="elem-badge" :class="`elem-${c.element}`">{{ elementSym[c.element] }}</span>
              </div>
              <img v-if="isCaught(c.id)" :src="portraitForChar(c.id, c.name, c.rarity, c.element, 1)" class="dex-portrait" />
              <div v-else class="dex-silhouette">
                <span class="text-6xl text-white/30">?</span>
              </div>
              <div class="dex-info">
                <h4 class="font-bold text-sm truncate">{{ isCaught(c.id) ? c.name : "???" }}</h4>
                <div class="text-[10px] text-white/55 truncate">{{ isCaught(c.id) ? c.apartmentSource : "未発見" }}</div>
                <p v-if="isCaught(c.id)" class="text-[10px] text-white/40 mt-1 line-clamp-2 leading-snug">{{ c.lore }}</p>
              </div>
            </div>
          </RarityFrame>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dex-header {
  display: flex; align-items: center; gap: 1rem; justify-content: space-between;
  padding: 0.75rem 1rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.85), rgba(15, 8, 30, 0.4));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  position: sticky; top: 0; z-index: 20;
}

.dex-main { max-width: 1200px; margin: 0 auto; padding: 1rem 0.85rem 3rem; }

.dex-controls {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0.6rem 0.85rem;
  background: rgba(31, 21, 56, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 0.6rem;
  flex-wrap: wrap; gap: 0.5rem;
}
.dex-tabs { display: flex; gap: 0.3rem; flex-wrap: wrap; }
.dex-tab {
  padding: 0.25rem 0.6rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.4rem;
  font-family: 'Orbitron', monospace;
  font-size: 11px;
  font-weight: 700;
  transition: all 0.2s ease;
}
.dex-tab:hover { background: rgba(255,255,255,0.15); }
.dex-tab--active {
  background: linear-gradient(135deg, #ff6b9d, #c34dff);
  color: white;
  box-shadow: 0 0 12px rgba(255,107,157,0.5);
  border-color: transparent;
}

.dex-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 0.7rem;
}

.dex-entry { transition: all 0.3s ease; }
.dex-entry--uncaught { opacity: 0.4; filter: grayscale(0.5); }

.dex-card {
  position: relative;
  display: flex; flex-direction: column;
}
.dex-portrait {
  width: 100%; aspect-ratio: 3/4; object-fit: cover;
  display: block;
  filter: contrast(1.05) saturate(1.1);
}
.dex-silhouette {
  width: 100%; aspect-ratio: 3/4;
  background: linear-gradient(135deg, rgba(0,0,0,0.5), rgba(20,14,38,0.7));
  display: flex; align-items: center; justify-content: center;
}
.dex-info {
  padding: 0.55rem 0.7rem 0.7rem;
  background: linear-gradient(to top, rgba(20,14,38,0.95), rgba(20,14,38,0.7));
}
</style>
