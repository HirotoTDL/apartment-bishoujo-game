<script setup lang="ts">
import { computed, ref } from "vue";
import { usePlayerStore } from "../stores/player";
import { ITEMS } from "../game/data/items";

const player = usePlayerStore();
const message = ref("");

const sellable = computed(() => Object.values(ITEMS).filter(i => i.price && i.price > 0));

function buy(itemId: string) {
  const item = ITEMS[itemId];
  if (!item.price) return;
  if (player.spendGold(item.price)) {
    player.addItem(itemId, 1);
    player.persist();
    message.value = `${item.name} を購入しました！`;
  } else {
    message.value = "所持金が足りません！";
  }
  setTimeout(() => (message.value = ""), 2500);
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-950 to-rose-950 text-white p-4 md:p-8">
    <header class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-2xl font-bold">ショップ</h2>
        <p class="text-xs text-white/60">所持金: <span class="text-yellow-300">{{ player.save!.currency.gold }} G</span></p>
      </div>
      <button class="btn-secondary text-sm" @click="$router.push({ name: 'home' })">← ホームへ</button>
    </header>

    <div class="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3">
      <div v-for="i in sellable" :key="i.id" class="panel p-4 flex justify-between items-center">
        <div>
          <div class="font-bold">{{ i.name }}</div>
          <div class="text-xs text-white/60">{{ i.description }}</div>
          <div class="text-xs text-white/50 mt-1">所持: {{ player.items[i.id] ?? 0 }}</div>
        </div>
        <button class="btn" @click="buy(i.id)">
          {{ i.price }} G
        </button>
      </div>
    </div>

    <div v-if="message" class="max-w-3xl mx-auto mt-4 panel p-3 text-center text-pink-200">
      {{ message }}
    </div>
  </div>
</template>
