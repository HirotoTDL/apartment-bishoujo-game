<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import PortraitCard from "../components/PortraitCard.vue";
import { CHARACTERS_BY_ID, type Rarity } from "../game/data/characters";
import ScenicBackground from "../components/ScenicBackground.vue";
import Icon from "../components/Icon.vue";

const player = usePlayerStore();
const router = useRouter();
const sortMode = ref<"rarity" | "level" | "newest">("rarity");

const owned = computed(() => player.save!.owned);
const partyUids = computed(() => player.save!.party);

function isInParty(uid: string) { return partyUids.value.includes(uid); }

function toggleParty(uid: string) {
  const cur = [...partyUids.value];
  const idx = cur.indexOf(uid);
  if (idx >= 0) cur.splice(idx, 1);
  else { if (cur.length >= 4) return; cur.push(uid); }
  if (cur.length === 0) return;
  player.setParty(cur);
  player.persist();
}

const sortedOwned = computed(() => {
  const list = [...owned.value];
  const order: Record<Rarity, number> = { UR: 0, SSR: 1, SR: 2, R: 3, N: 4 };
  switch (sortMode.value) {
    case "level":
      list.sort((a, b) => b.level - a.level || order[CHARACTERS_BY_ID[a.charId].rarity] - order[CHARACTERS_BY_ID[b.charId].rarity]);
      break;
    case "newest":
      list.sort((a, b) => b.caughtAt - a.caughtAt);
      break;
    default:
      list.sort((a, b) => {
        const ra = CHARACTERS_BY_ID[a.charId].rarity, rb = CHARACTERS_BY_ID[b.charId].rarity;
        return order[ra] - order[rb] || b.level - a.level;
      });
  }
  return list;
});

const sortLabels = { rarity: "レア度", level: "レベル", newest: "入手順" };
</script>

<template>
  <div class="pv-root">
    <ScenicBackground scene="sanctuary" />

    <header class="pv-header">
      <button class="pv-back" @click="router.push({ name: 'home' })"><Icon name="arrow-back" :size="14" /></button>
      <div>
        <div class="pv-eyebrow">PARTY MANAGEMENT</div>
        <h2 class="pv-title">編成 / 育成</h2>
      </div>
      <div class="pv-count">
        <div class="pv-count-label">OWNED</div>
        <div class="pv-count-val">{{ owned.length }}<small>/50</small></div>
      </div>
    </header>

    <main class="pv-main">
      <!-- Active party (fixed top) -->
      <section class="pv-active">
        <div class="pv-section-row">
          <div>
            <div class="pv-section-eyebrow">★ ACTIVE PARTY</div>
            <h3 class="pv-section-title">現在のパーティ</h3>
          </div>
          <div class="pv-meter">
            <div v-for="i in 4" :key="i" class="pv-meter-cell" :class="i <= partyUids.length && 'pv-meter-full'"></div>
          </div>
        </div>
        <div class="pv-party-grid">
          <div v-for="uid in partyUids" :key="uid" @click="toggleParty(uid)" class="pv-slot">
            <PortraitCard v-if="owned.find(o => o.uid === uid)"
              :char="owned.find(o => o.uid === uid)!" :selected="true" :show-stats="false" />
          </div>
          <div v-for="i in (4 - partyUids.length)" :key="'em' + i" class="pv-empty">
            <Icon name="users" :size="20" /><span>EMPTY</span>
          </div>
        </div>
      </section>

      <!-- Pool (scrollable inner) -->
      <section class="pv-pool">
        <div class="pv-section-row">
          <div>
            <div class="pv-section-eyebrow">◆ COLLECTION</div>
            <h3 class="pv-section-title">所持キャラクター</h3>
          </div>
          <div class="pv-sort-tabs">
            <span class="pv-sort-label">並び</span>
            <button v-for="m in ['rarity','level','newest']" :key="m"
              class="pv-sort-tab" :class="sortMode === m && 'pv-sort-tab--active'"
              @click="sortMode = m as any">{{ sortLabels[m as keyof typeof sortLabels] }}</button>
          </div>
        </div>
        <div class="pv-pool-scroll">
          <div class="pv-pool-grid">
            <div v-for="c in sortedOwned" :key="c.uid" class="pv-slot">
              <PortraitCard :char="c" :selected="isInParty(c.uid)" :show-stats="false" @click="toggleParty(c.uid)" />
              <button class="pv-detail-btn" @click.stop="router.push({ name: 'character', params: { uid: c.uid } })">
                <Icon name="scroll" :size="10" /><span>詳細</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.pv-root {
  position: absolute; inset: 0;
  overflow: hidden;
  color: white;
  display: flex; flex-direction: column;
}

.pv-header {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 0.9rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.92), rgba(15, 8, 30, 0.55));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
.pv-back {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 5px; color: white;
}
.pv-eyebrow { font-family: 'Orbitron', monospace; font-size: 9px; letter-spacing: 0.3em; color: rgba(255, 200, 230, 0.7); }
.pv-title { font-size: 1.1rem; font-weight: 800; margin: 1px 0 0; }
.pv-count { margin-left: auto; text-align: right; }
.pv-count-label { font-family: 'Orbitron', monospace; font-size: 8px; letter-spacing: 0.2em; color: rgba(255,255,255,0.5); }
.pv-count-val { font-family: 'Orbitron', monospace; font-size: 1.2rem; font-weight: 900; color: #fde047; text-shadow: 0 0 10px rgba(253,224,71,0.5); }
.pv-count-val small { color: rgba(255,255,255,0.35); font-size: 0.75rem; }

.pv-main {
  flex: 1; min-height: 0;
  padding: 0.85rem;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 0.85rem;
}

.pv-section-row {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 0.85rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}
.pv-section-eyebrow { font-family: 'Orbitron', monospace; font-size: 9px; letter-spacing: 0.3em; color: rgba(255, 200, 230, 0.7); }
.pv-section-title { font-size: 0.95rem; font-weight: 800; margin-top: 1px; }

.pv-meter { display: flex; gap: 0.3rem; align-items: center; }
.pv-meter-cell { width: 28px; height: 5px; background: rgba(255, 255, 255, 0.08); border-radius: 1.5px; }
.pv-meter-full { background: linear-gradient(90deg, #ff6b9d, #c34dff); box-shadow: 0 0 8px rgba(255, 107, 157, 0.6); }

.pv-sort-tabs { display: flex; gap: 0.2rem; align-items: center; }
.pv-sort-label { font-family: 'Orbitron', monospace; font-size: 8px; letter-spacing: 0.2em; color: rgba(255,255,255,0.5); margin-right: 0.3rem; }
.pv-sort-tab {
  padding: 0.25rem 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  font-size: 10px; font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
}
.pv-sort-tab:hover { background: rgba(255, 107, 157, 0.18); color: white; }
.pv-sort-tab--active { background: linear-gradient(135deg, #ff6b9d, #c34dff); border-color: transparent; color: white; box-shadow: 0 0 10px rgba(255, 107, 157, 0.5); }

/* Active party row - fixed compact size */
.pv-active { flex-shrink: 0; }
.pv-party-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: 220px;
  gap: 0.55rem;
}
.pv-slot {
  position: relative; cursor: pointer;
  min-height: 0; min-width: 0;
  height: 100%;
}
.pv-party-grid .pv-slot :deep(.pcard) {
  height: 100%;
  display: flex; flex-direction: column;
}
.pv-party-grid .pv-slot :deep(.pcard-portrait) {
  flex: 1; aspect-ratio: auto; min-height: 0;
}
.pv-party-grid .pv-slot :deep(.pcard-portrait img) {
  height: 100%; width: 100%; object-fit: cover;
}
.pv-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.3rem;
  height: 100%;
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.25);
  font-family: 'Orbitron', monospace;
  font-size: 9px; letter-spacing: 0.25em;
}

/* Pool (scrollable inner) */
.pv-pool {
  min-height: 0;
  display: flex; flex-direction: column;
  background: linear-gradient(135deg, rgba(31, 21, 56, 0.78), rgba(20, 12, 40, 0.78));
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
}
.pv-pool-scroll {
  flex: 1; min-height: 0;
  overflow-y: auto;
  padding-right: 0.3rem;
}
.pv-pool-scroll::-webkit-scrollbar { width: 5px; }
.pv-pool-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }

.pv-pool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
}

.pv-detail-btn {
  margin-top: 0.3rem;
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 0.3rem;
  padding: 0.3rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  font-size: 10px;
  color: rgba(255, 200, 230, 0.75);
  transition: all 0.2s ease;
}
.pv-detail-btn:hover {
  background: rgba(255, 107, 157, 0.18);
  border-color: rgba(255, 107, 157, 0.5);
  color: white;
}
</style>
