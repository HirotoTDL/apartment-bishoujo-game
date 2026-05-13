<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import PortraitCard from "../components/PortraitCard.vue";
import { CHARACTERS_BY_ID, type Rarity } from "../game/data/characters";
import AnimatedBackground from "../components/AnimatedBackground.vue";
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
  <div class="party-root">
    <AnimatedBackground variant="cosmic" intensity="normal" />

    <header class="party-header">
      <button class="party-back" @click="router.push({ name: 'home' })">
        <Icon name="arrow-back" :size="16" />
      </button>
      <div class="flex-1">
        <div class="party-eyebrow">PARTY MANAGEMENT</div>
        <h2 class="party-title">編成 / 育成</h2>
      </div>
      <div class="party-count">
        <div class="party-count-label">OWNED</div>
        <div class="party-count-val">{{ owned.length }}<small>/50</small></div>
      </div>
    </header>

    <main class="party-main">
      <!-- Active party section -->
      <section class="party-active">
        <div class="section-row">
          <div>
            <div class="section-eyebrow">★ ACTIVE PARTY</div>
            <h3 class="section-title">現在のパーティ</h3>
          </div>
          <div class="party-meter">
            <div v-for="i in 4" :key="i" class="party-meter-cell"
              :class="i <= partyUids.length ? 'party-meter-cell--full' : ''"></div>
          </div>
        </div>
        <div class="party-grid party-grid--active">
          <div v-for="uid in partyUids" :key="uid" @click="toggleParty(uid)" class="party-slot">
            <PortraitCard
              v-if="owned.find(o => o.uid === uid)"
              :char="owned.find(o => o.uid === uid)!"
              :selected="true"
            />
          </div>
          <div v-for="i in (4 - partyUids.length)" :key="'em' + i" class="party-empty-slot">
            <Icon name="users" :size="28" />
            <span>EMPTY</span>
          </div>
        </div>
      </section>

      <!-- All owned section -->
      <section class="party-pool">
        <div class="section-row">
          <div>
            <div class="section-eyebrow">◆ COLLECTION</div>
            <h3 class="section-title">所持キャラクター</h3>
          </div>
          <div class="sort-tabs">
            <span class="sort-label">並び順</span>
            <button v-for="m in ['rarity','level','newest']" :key="m"
              class="sort-tab"
              :class="sortMode === m ? 'sort-tab--active' : ''"
              @click="sortMode = m as any"
            >{{ sortLabels[m as keyof typeof sortLabels] }}</button>
          </div>
        </div>
        <div class="party-grid party-grid--pool">
          <div v-for="c in sortedOwned" :key="c.uid" class="party-slot">
            <PortraitCard
              :char="c"
              :selected="isInParty(c.uid)"
              :show-stats="false"
              @click="toggleParty(c.uid)"
            />
            <button
              class="detail-btn"
              @click.stop="router.push({ name: 'character', params: { uid: c.uid } })"
            >
              <Icon name="scroll" :size="12" />
              詳細
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.party-root { min-height: 100vh; color: white; }

.party-header {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.95), rgba(15, 8, 30, 0.55));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky; top: 0; z-index: 20;
}
.party-back {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  color: white;
}
.party-eyebrow {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.7);
}
.party-title { font-size: 1.25rem; font-weight: 800; }
.party-count { text-align: right; }
.party-count-label {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(255,255,255,0.5);
}
.party-count-val {
  font-family: 'Orbitron', monospace;
  font-size: 1.5rem;
  font-weight: 900;
  color: #fde047;
  text-shadow: 0 0 12px rgba(253,224,71,0.6);
}
.party-count-val small { color: rgba(255,255,255,0.35); font-size: 0.9rem; margin-left: 2px; }

.party-main { max-width: 1150px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }

.party-active { margin-bottom: 2rem; }

.section-row {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem;
  margin-bottom: 0.85rem;
  flex-wrap: wrap;
}
.section-eyebrow {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.7);
}
.section-title { font-size: 1.1rem; font-weight: 800; margin-top: 2px; }

.party-meter { display: flex; gap: 0.35rem; align-items: center; }
.party-meter-cell {
  width: 32px; height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 1.5px;
}
.party-meter-cell--full {
  background: linear-gradient(90deg, #ff6b9d, #c34dff);
  box-shadow: 0 0 8px rgba(255, 107, 157, 0.6);
}

.sort-tabs {
  display: flex; gap: 0.25rem; align-items: center;
}
.sort-label {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(255,255,255,0.5);
  margin-right: 0.35rem;
}
.sort-tab {
  padding: 0.35rem 0.65rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s ease;
}
.sort-tab:hover { background: rgba(255, 107, 157, 0.18); color: white; }
.sort-tab--active {
  background: linear-gradient(135deg, #ff6b9d, #c34dff);
  border-color: transparent;
  color: white;
  font-weight: 700;
  box-shadow: 0 0 14px rgba(255, 107, 157, 0.5);
}

.party-grid {
  display: grid;
  gap: 0.7rem;
}
.party-grid--active {
  grid-template-columns: repeat(4, 1fr);
}
.party-grid--pool {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}
@media (max-width: 600px) {
  .party-grid--active { grid-template-columns: 1fr 1fr; }
}

.party-slot { position: relative; }
.detail-btn {
  margin-top: 0.4rem;
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 0.35rem;
  padding: 0.4rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 11px;
  color: rgba(255, 200, 230, 0.75);
  transition: all 0.2s ease;
}
.detail-btn:hover {
  background: rgba(255, 107, 157, 0.18);
  border-color: rgba(255, 107, 157, 0.5);
  color: white;
}

.party-empty-slot {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 0.5rem;
  aspect-ratio: 3/5;
  border: 2px dashed rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.25);
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.25em;
}
</style>
