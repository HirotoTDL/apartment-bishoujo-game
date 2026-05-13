<script setup lang="ts">
import { computed } from "vue";
import { usePlayerStore } from "../stores/player";
import CharCard from "../components/CharCard.vue";
import { CHARACTERS_BY_ID } from "../game/data/characters";

const player = usePlayerStore();

const owned = computed(() => player.save!.owned);
const partyUids = computed(() => player.save!.party);

function isInParty(uid: string) { return partyUids.value.includes(uid); }

function toggleParty(uid: string) {
  const cur = [...partyUids.value];
  const idx = cur.indexOf(uid);
  if (idx >= 0) {
    cur.splice(idx, 1);
  } else {
    if (cur.length >= 4) return;
    cur.push(uid);
  }
  if (cur.length === 0) return;
  player.setParty(cur);
  player.persist();
}

function sortedOwned() {
  return [...owned.value].sort((a, b) => {
    const ra = CHARACTERS_BY_ID[a.charId]?.rarity ?? "N";
    const rb = CHARACTERS_BY_ID[b.charId]?.rarity ?? "N";
    const order: Record<string, number> = { UR: 0, SSR: 1, SR: 2, R: 3, N: 4 };
    if (order[ra] !== order[rb]) return order[ra] - order[rb];
    return b.level - a.level;
  });
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-950 to-purple-950 text-white p-4 md:p-8">
    <header class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-bold">編成・育成</h2>
        <p class="text-xs text-white/60">パーティは最大4体、最低1体必要です。</p>
      </div>
      <button class="btn-secondary text-sm" @click="$router.push({ name: 'home' })">← ホームへ</button>
    </header>

    <section class="max-w-5xl mx-auto mb-6">
      <h3 class="text-pink-200 font-bold mb-2">現在のパーティ ({{ partyUids.length }}/4)</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div v-for="uid in partyUids" :key="uid">
          <CharCard
            v-if="owned.find(o => o.uid === uid)"
            :char="owned.find(o => o.uid === uid)!"
            selected
            @click="$router.push({ name: 'character', params: { uid } })"
          />
        </div>
        <div
          v-for="i in (4 - partyUids.length)"
          :key="'empty' + i"
          class="panel p-3 text-center text-white/30 min-h-[120px] flex items-center justify-center"
        >
          空き枠
        </div>
      </div>
    </section>

    <section class="max-w-5xl mx-auto">
      <h3 class="text-pink-200 font-bold mb-2">所持キャラクター ({{ owned.length }})</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="c in sortedOwned()"
          :key="c.uid"
          class="cursor-pointer"
          @click="toggleParty(c.uid)"
        >
          <CharCard :char="c" :selected="isInParty(c.uid)" compact />
          <button
            class="mt-1 btn-secondary text-xs w-full"
            @click.stop="$router.push({ name: 'character', params: { uid: c.uid } })"
          >
            詳細
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
