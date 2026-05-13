<script setup lang="ts">
import { computed, ref } from "vue";
import { usePlayerStore } from "../stores/player";
import CharCard from "../components/CharCard.vue";
import { CHARACTERS_BY_ID, type Rarity } from "../game/data/characters";
import AnimatedBackground from "../components/AnimatedBackground.vue";

const player = usePlayerStore();
const sortMode = ref<"rarity" | "level" | "newest">("rarity");

const owned = computed(() => player.save!.owned);
const partyUids = computed(() => player.save!.party);

function isInParty(uid: string) { return partyUids.value.includes(uid); }

function toggleParty(uid: string) {
  const cur = [...partyUids.value];
  const idx = cur.indexOf(uid);
  if (idx >= 0) cur.splice(idx, 1);
  else {
    if (cur.length >= 4) return;
    cur.push(uid);
  }
  if (cur.length === 0) return;
  player.setParty(cur);
  player.persist();
}

const sortedOwned = computed(() => {
  const list = [...owned.value];
  const rarityOrder: Record<Rarity, number> = { UR: 0, SSR: 1, SR: 2, R: 3, N: 4 };
  switch (sortMode.value) {
    case "level":
      list.sort((a, b) => b.level - a.level || rarityOrder[CHARACTERS_BY_ID[a.charId].rarity] - rarityOrder[CHARACTERS_BY_ID[b.charId].rarity]);
      break;
    case "newest":
      list.sort((a, b) => b.caughtAt - a.caughtAt);
      break;
    default:
      list.sort((a, b) => {
        const ra = CHARACTERS_BY_ID[a.charId].rarity, rb = CHARACTERS_BY_ID[b.charId].rarity;
        return rarityOrder[ra] - rarityOrder[rb] || b.level - a.level;
      });
  }
  return list;
});
</script>

<template>
  <div class="party-root min-h-screen text-white">
    <AnimatedBackground variant="cosmic" intensity="normal" />

    <header class="party-header">
      <button class="btn-secondary text-sm" @click="$router.push({ name: 'home' })">← ホームへ</button>
      <h2 class="text-xl font-bold text-game-shadow">編成 / 育成</h2>
      <div class="text-xs text-white/50 font-tech">{{ owned.length }} OWNED</div>
    </header>

    <main class="party-main">
      <section class="party-section">
        <div class="section-header">
          <h3 class="section-title">★ パーティ</h3>
          <span class="text-xs text-white/60">{{ partyUids.length }} / 4</span>
        </div>
        <div class="party-grid">
          <div v-for="uid in partyUids" :key="uid" @click="toggleParty(uid)" class="cursor-pointer">
            <CharCard
              v-if="owned.find(o => o.uid === uid)"
              :char="owned.find(o => o.uid === uid)!"
              :selected="true"
            />
          </div>
          <div
            v-for="i in (4 - partyUids.length)" :key="'empty' + i"
            class="empty-slot"
          >
            <span>＋ 空き枠</span>
          </div>
        </div>
      </section>

      <section class="party-section mt-6">
        <div class="section-header">
          <h3 class="section-title">所持キャラクター</h3>
          <div class="flex gap-1.5 text-xs">
            <button v-for="m in ['rarity','level','newest']" :key="m"
              class="sort-btn"
              :class="sortMode === m ? 'sort-btn--active' : ''"
              @click="sortMode = m as any"
            >{{ m === 'rarity' ? 'レア度順' : m === 'level' ? 'レベル順' : '入手順' }}</button>
          </div>
        </div>
        <div class="party-grid party-grid--all">
          <div
            v-for="c in sortedOwned" :key="c.uid"
            class="cursor-pointer"
            @click="toggleParty(c.uid)"
          >
            <CharCard :char="c" :selected="isInParty(c.uid)" compact />
            <button
              class="detail-btn"
              @click.stop="$router.push({ name: 'character', params: { uid: c.uid } })"
            >📋 詳細</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.party-header {
  display: flex; align-items: center; gap: 1rem; justify-content: space-between;
  padding: 0.75rem 1rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.85), rgba(15, 8, 30, 0.4));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  position: sticky; top: 0; z-index: 20;
}

.party-main {
  max-width: 1100px; margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}
.party-section { }
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 0.85rem;
  padding: 0 0.25rem;
}
.section-title {
  font-size: 1.05rem; font-weight: 800;
  color: #ffc6db;
  text-shadow: 0 0 12px rgba(255, 107, 157, 0.5);
}
.party-grid {
  display: grid; gap: 0.6rem;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}
.party-grid--all {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.empty-slot {
  display: flex; align-items: center; justify-content: center;
  min-height: 120px;
  border: 2px dashed rgba(255,255,255,0.15);
  border-radius: 1rem;
  color: rgba(255,255,255,0.3);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
.empty-slot:hover { border-color: rgba(255,107,157,0.4); color: rgba(255,107,157,0.6); }

.sort-btn {
  padding: 0.25rem 0.65rem;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 0.4rem;
  font-size: 11px;
  transition: all 0.2s ease;
}
.sort-btn:hover { background: rgba(255,255,255,0.15); }
.sort-btn--active {
  background: linear-gradient(135deg, #ff6b9d, #c34dff);
  border-color: transparent;
  box-shadow: 0 0 12px rgba(255,107,157,0.5);
  color: white;
  font-weight: 600;
}

.detail-btn {
  width: 100%;
  margin-top: 0.4rem;
  padding: 0.35rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.4rem;
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  transition: all 0.2s ease;
}
.detail-btn:hover {
  background: rgba(255,107,157,0.2);
  border-color: rgba(255,107,157,0.5);
  color: white;
}
</style>
