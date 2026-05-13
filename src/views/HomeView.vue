<script setup lang="ts">
import { computed } from "vue";
import { usePlayerStore } from "../stores/player";

const player = usePlayerStore();

const menu = [
  { to: { name: "stages" }, label: "ストーリー", desc: "ステージを進める", icon: "🏘️" },
  { to: { name: "party" }, label: "編成 / 育成", desc: "パーティを組む", icon: "👥" },
  { to: { name: "dex" }, label: "図鑑", desc: "出会ったキャラ一覧", icon: "📖" },
  { to: { name: "shop" }, label: "ショップ", desc: "アイテム購入", icon: "🛍️" },
];

const summary = computed(() => {
  const s = player.save!;
  return {
    party: player.party.length,
    owned: s.owned.length,
    gold: s.currency.gold,
    cleared: s.clearedStages.length,
  };
});

async function rest() {
  player.restAll();
  await player.persist();
  alert("全員が完全回復した！");
}
</script>

<template>
  <div v-if="player.save" class="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-rose-950 text-white p-4 md:p-8">
    <header class="flex items-center justify-between mb-6 flex-wrap gap-2">
      <div>
        <h2 class="text-2xl font-bold">ようこそ、{{ player.save.displayName }} さん</h2>
        <p class="text-white/60 text-sm">アパート☆ガーデン総合管理パネル</p>
      </div>
      <div class="flex gap-3 text-sm bg-black/30 rounded-lg px-4 py-2">
        <span>💰 {{ summary.gold }} G</span>
        <span>📚 {{ summary.owned }} 体所持</span>
        <span>🏆 {{ summary.cleared }} ステージクリア</span>
      </div>
    </header>

    <main class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
      <router-link
        v-for="m in menu"
        :key="m.label"
        :to="m.to"
        class="panel p-6 hover:bg-white/5 hover:scale-[1.02] transition flex items-center gap-4"
      >
        <div class="text-5xl">{{ m.icon }}</div>
        <div>
          <h3 class="text-xl font-bold">{{ m.label }}</h3>
          <p class="text-white/60 text-sm">{{ m.desc }}</p>
        </div>
      </router-link>
    </main>

    <div class="max-w-4xl mx-auto mt-6 flex flex-wrap gap-3">
      <button class="btn-secondary" @click="rest">💤 パーティを休ませる(全回復)</button>
      <button class="btn-secondary" @click="player.persist()">💾 セーブ</button>
    </div>
  </div>
</template>
