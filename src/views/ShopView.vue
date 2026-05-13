<script setup lang="ts">
import { computed, ref } from "vue";
import { usePlayerStore } from "../stores/player";
import { ITEMS } from "../game/data/items";
import AnimatedBackground from "../components/AnimatedBackground.vue";

const player = usePlayerStore();
const message = ref<{ text: string; ok: boolean } | null>(null);

const sellable = computed(() => Object.values(ITEMS).filter(i => i.price && i.price > 0));

function buy(itemId: string) {
  const item = ITEMS[itemId];
  if (!item.price) return;
  if (player.spendGold(item.price)) {
    player.addItem(itemId, 1);
    player.persist();
    message.value = { text: `${item.name} を購入しました！`, ok: true };
  } else {
    message.value = { text: "所持金が足りません！", ok: false };
  }
  setTimeout(() => { message.value = null; }, 2500);
}

const itemIcon: Record<string, string> = {
  rent_card: "📄", premium_card: "✨", luxury_card: "💎", master_card: "🗝️",
  potion_s: "🧪", potion_m: "🧪", potion_l: "🧪", ether_s: "💧",
};
</script>

<template>
  <div class="shop-root min-h-screen text-white">
    <AnimatedBackground variant="cosmic" intensity="normal" />

    <header class="shop-header">
      <button class="btn-secondary text-sm" @click="$router.push({ name: 'home' })">← ホームへ</button>
      <h2 class="text-xl font-bold text-game-shadow">ショップ</h2>
      <div class="gold-badge">
        <span class="text-lg">💰</span>
        <div>
          <div class="text-[9px] text-white/60 font-tech tracking-wider">GOLD</div>
          <div class="font-bold tabular-nums">{{ player.save!.currency.gold.toLocaleString() }}</div>
        </div>
      </div>
    </header>

    <main class="shop-main">
      <div class="shop-grid">
        <div v-for="i in sellable" :key="i.id" class="shop-item animate-fade-in-up">
          <div class="shop-item-icon">{{ itemIcon[i.id] || "🎁" }}</div>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-base">{{ i.name }}</div>
            <div class="text-xs text-white/55 mt-0.5">{{ i.description }}</div>
            <div class="text-[10px] text-white/40 mt-1 font-tech">OWNED: {{ player.items[i.id] ?? 0 }}</div>
          </div>
          <button class="shop-buy-btn" @click="buy(i.id)" :disabled="player.save!.currency.gold < i.price!">
            <span class="text-xs text-white/70 font-tech">PRICE</span>
            <span class="font-bold text-base">{{ i.price }} G</span>
          </button>
        </div>
      </div>

      <transition>
        <div v-if="message" class="shop-toast" :class="message.ok ? 'shop-toast--ok' : 'shop-toast--err'">
          {{ message.text }}
        </div>
      </transition>
    </main>
  </div>
</template>

<style scoped>
.shop-header {
  display: flex; align-items: center; gap: 1rem; justify-content: space-between;
  padding: 0.75rem 1rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.85), rgba(15, 8, 30, 0.4));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  position: sticky; top: 0; z-index: 20;
}
.gold-badge {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.4rem 0.85rem;
  background: linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.12));
  border: 1px solid rgba(251,191,36,0.4);
  border-radius: 0.5rem;
  box-shadow: 0 0 12px rgba(251,191,36,0.2);
}

.shop-main { max-width: 800px; margin: 0 auto; padding: 1.5rem 1rem; position: relative; }
.shop-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem;
}
@media (min-width: 700px) {
  .shop-grid { grid-template-columns: 1fr 1fr; }
}

.shop-item {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, rgba(31, 21, 56, 0.9), rgba(42, 28, 74, 0.9));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 0.75rem;
}
.shop-item-icon {
  width: 56px; height: 56px;
  font-size: 2rem;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
  border-radius: 0.6rem;
  flex-shrink: 0;
}
.shop-buy-btn {
  display: flex; flex-direction: column; align-items: center;
  padding: 0.55rem 1rem;
  background: linear-gradient(135deg, #fbbf24, #d97706);
  border: 1px solid rgba(253,224,71,0.5);
  border-radius: 0.5rem;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  font-family: 'M PLUS Rounded 1c', sans-serif;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-shadow: 0 0 12px rgba(251,191,36,0.3);
}
.shop-buy-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 0 24px rgba(251,191,36,0.6), 0 6px 16px rgba(0,0,0,0.4);
  filter: brightness(1.1);
}
.shop-buy-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.shop-toast {
  position: fixed; bottom: 2rem; left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  border-radius: 0.6rem;
  font-weight: 700;
  z-index: 50;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
}
.shop-toast--ok {
  background: linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95));
  border: 1px solid rgba(52,211,153,0.6);
  color: white;
}
.shop-toast--err {
  background: linear-gradient(135deg, rgba(225,29,72,0.95), rgba(159,18,57,0.95));
  border: 1px solid rgba(251,113,133,0.6);
  color: white;
}
.v-enter-active, .v-leave-active { transition: all 0.3s ease; }
.v-enter-from, .v-leave-to { opacity: 0; transform: translate(-50%, 20px); }
</style>
