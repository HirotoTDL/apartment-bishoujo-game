<script setup lang="ts">
import { computed, ref } from "vue";
import { usePlayerStore } from "../stores/player";
import { CHARACTERS, type Rarity } from "../game/data/characters";
import { portraitForChar } from "../assets/placeholder";

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
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-950 to-pink-950 text-white p-4 md:p-8">
    <header class="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div>
        <h2 class="text-2xl font-bold">アパート図鑑</h2>
        <p class="text-xs text-white/60">{{ stats.caught }} / {{ stats.total }} ({{ stats.pct }}%)</p>
      </div>
      <button class="btn-secondary text-sm" @click="$router.push({ name: 'home' })">← ホームへ</button>
    </header>

    <div class="max-w-5xl mx-auto mb-4 panel p-3 flex flex-wrap gap-2 items-center text-sm">
      <span>レアリティ:</span>
      <button
        v-for="r in ['ALL','UR','SSR','SR','R','N']"
        :key="r"
        class="px-2 py-1 rounded transition"
        :class="filterRarity === r ? 'bg-ui-accent text-black font-bold' : 'bg-white/10 hover:bg-white/20'"
        @click="filterRarity = r as any"
      >
        {{ r }}
      </button>
      <label class="ml-auto text-xs flex items-center gap-1">
        <input type="checkbox" v-model="showUncaught" /> 未捕獲も表示
      </label>
    </div>

    <div class="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      <div
        v-for="c in visibleList"
        :key="c.id"
        class="panel p-3 transition"
        :class="isCaught(c.id) ? '' : 'opacity-40'"
      >
        <img
          v-if="isCaught(c.id)"
          :src="portraitForChar(c.id, c.name, c.rarity, c.element, 1)"
          class="w-full rounded"
        />
        <div v-else class="w-full aspect-[3/4] bg-black/40 rounded flex items-center justify-center text-3xl">?</div>
        <div class="mt-2 text-sm font-bold truncate">
          <span :class="`rarity-${c.rarity}`">{{ c.rarity }}</span> {{ isCaught(c.id) ? c.name : "???" }}
        </div>
        <div class="text-xs text-white/60 truncate">{{ isCaught(c.id) ? c.apartmentSource : "未発見" }}</div>
        <div v-if="isCaught(c.id)" class="text-xs text-white/40 mt-1">{{ c.lore }}</div>
      </div>
    </div>
  </div>
</template>
