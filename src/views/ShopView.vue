<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { ITEMS } from "../game/data/items";
import AnimatedBackground from "../components/AnimatedBackground.vue";
import Icon from "../components/Icon.vue";

const player = usePlayerStore();
const router = useRouter();
const message = ref<{ text: string; ok: boolean } | null>(null);

const sellable = computed(() => Object.values(ITEMS).filter(i => i.price && i.price > 0));

function buy(itemId: string) {
  const item = ITEMS[itemId];
  if (!item.price) return;
  if (player.spendGold(item.price)) {
    player.addItem(itemId, 1);
    player.persist();
    message.value = { text: `${item.name} を購入しました`, ok: true };
  } else {
    message.value = { text: "所持金が足りません", ok: false };
  }
  setTimeout(() => { message.value = null; }, 2500);
}

const itemIcon: Record<string, string> = {
  rent_card: "scroll", premium_card: "scroll", luxury_card: "scroll", master_card: "key",
  potion_s: "flask", potion_m: "flask", potion_l: "flask", ether_s: "flask",
};
const itemTier: Record<string, "common" | "rare" | "epic" | "legendary"> = {
  rent_card: "common", premium_card: "rare", luxury_card: "epic", master_card: "legendary",
  potion_s: "common", potion_m: "rare", potion_l: "epic", ether_s: "common",
};
</script>

<template>
  <div class="shop-root">
    <AnimatedBackground variant="cosmic" intensity="normal" />

    <header class="shop-header">
      <button class="shop-back" @click="router.push({ name: 'home' })">
        <Icon name="arrow-back" :size="16" />
      </button>
      <div class="flex-1">
        <div class="shop-eyebrow">SHOP</div>
        <h2 class="shop-title">アイテムショップ</h2>
      </div>
      <div class="shop-gold">
        <Icon name="gold" :size="20" />
        <span>{{ player.save!.currency.gold.toLocaleString() }}</span>
        <small>G</small>
      </div>
    </header>

    <main class="shop-main">
      <div class="shop-section-row">
        <div>
          <div class="shop-section-eyebrow">⌘ AVAILABLE ITEMS</div>
          <h3 class="shop-section-title">商品ラインナップ</h3>
        </div>
      </div>

      <div class="shop-grid">
        <div v-for="i in sellable" :key="i.id" class="shop-item animate-fade-in-up" :class="`shop-item--${itemTier[i.id] || 'common'}`">
          <div class="shop-item-icon">
            <Icon :name="itemIcon[i.id] || 'sparkle'" :size="28" />
          </div>
          <div class="shop-item-body">
            <div class="shop-item-tier">{{ (itemTier[i.id] || 'common').toUpperCase() }}</div>
            <div class="shop-item-name">{{ i.name }}</div>
            <div class="shop-item-desc">{{ i.description }}</div>
            <div class="shop-item-owned">所持: <b>{{ player.items[i.id] ?? 0 }}</b></div>
          </div>
          <button class="shop-buy" @click="buy(i.id)" :disabled="player.save!.currency.gold < i.price!">
            <Icon name="gold" :size="16" />
            <span>{{ i.price }}</span>
          </button>
        </div>
      </div>

      <transition>
        <div v-if="message" class="shop-toast" :class="message.ok ? 'shop-toast--ok' : 'shop-toast--err'">
          <Icon :name="message.ok ? 'check' : 'lock'" :size="18" />
          <span>{{ message.text }}</span>
        </div>
      </transition>
    </main>
  </div>
</template>

<style scoped>
.shop-root { min-height: 100vh; color: white; }

.shop-header {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.95), rgba(15, 8, 30, 0.55));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky; top: 0; z-index: 20;
}
.shop-back {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  color: white;
}
.shop-eyebrow {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.7);
}
.shop-title { font-size: 1.25rem; font-weight: 800; }
.shop-gold {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  background: linear-gradient(135deg, rgba(180,83,9,0.45), rgba(146,64,14,0.35));
  border: 1px solid rgba(251, 191, 36, 0.6);
  border-radius: 6px;
  box-shadow: 0 0 14px rgba(251, 191, 36, 0.25);
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 1.05rem;
  color: #fde68a;
  text-shadow: 0 0 8px rgba(253, 230, 138, 0.6);
}
.shop-gold small { font-size: 0.65rem; color: rgba(253, 230, 138, 0.7); margin-left: 1px; }

.shop-main { max-width: 900px; margin: 0 auto; padding: 1.25rem 1rem 3rem; position: relative; }

.shop-section-row { margin-bottom: 0.85rem; }
.shop-section-eyebrow {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.7);
}
.shop-section-title { font-size: 1.1rem; font-weight: 800; margin-top: 2px; }

.shop-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.55rem;
}
@media (min-width: 700px) {
  .shop-grid { grid-template-columns: 1fr 1fr; }
}

.shop-item {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, rgba(31, 21, 56, 0.9), rgba(20, 12, 40, 0.9));
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}
.shop-item::before {
  content: '';
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px;
  transition: opacity 0.3s ease;
}
.shop-item:hover { border-color: rgba(255, 200, 230, 0.25); transform: translateY(-2px); }
.shop-item--common::before { background: #94a3b8; }
.shop-item--rare::before { background: #60a5fa; box-shadow: 0 0 8px #60a5fa; }
.shop-item--epic::before { background: #c084fc; box-shadow: 0 0 8px #c084fc; }
.shop-item--legendary::before { background: linear-gradient(180deg, #fbbf24, #f87171); box-shadow: 0 0 12px #fbbf24; }

.shop-item-icon {
  width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 200, 230, 0.85);
  flex-shrink: 0;
}
.shop-item--rare .shop-item-icon { color: #93c5fd; border-color: rgba(96, 165, 250, 0.3); }
.shop-item--epic .shop-item-icon { color: #d8b4fe; border-color: rgba(192, 132, 252, 0.3); }
.shop-item--legendary .shop-item-icon { color: #fde68a; border-color: rgba(251, 191, 36, 0.4); }

.shop-item-body { flex: 1; min-width: 0; }
.shop-item-tier {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.25em;
  color: rgba(255, 200, 230, 0.5);
}
.shop-item--rare .shop-item-tier { color: #93c5fd; }
.shop-item--epic .shop-item-tier { color: #d8b4fe; }
.shop-item--legendary .shop-item-tier { color: #fde68a; }
.shop-item-name { font-size: 1rem; font-weight: 800; margin-top: 1px; }
.shop-item-desc { font-size: 11.5px; color: rgba(255, 255, 255, 0.55); margin-top: 2px; }
.shop-item-owned {
  font-size: 11px;
  color: rgba(255, 200, 230, 0.55);
  margin-top: 4px;
}
.shop-item-owned b { color: white; font-family: 'Orbitron', monospace; }

.shop-buy {
  flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 0.55rem 0.85rem;
  background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
  border: 1px solid rgba(253, 230, 138, 0.5);
  border-radius: 6px;
  color: white;
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 1rem;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  box-shadow: 0 0 14px rgba(251, 191, 36, 0.3), 0 4px 12px rgba(0,0,0,0.4);
  transition: all 0.2s ease;
  /* octagonal */
  clip-path: polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px);
}
.shop-buy:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.1);
  box-shadow: 0 0 24px rgba(251, 191, 36, 0.6), 0 6px 16px rgba(0,0,0,0.4);
}
.shop-buy:disabled { opacity: 0.4; cursor: not-allowed; }

/* Toast */
.shop-toast {
  position: fixed; bottom: 1.5rem; left: 50%;
  transform: translateX(-50%);
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.7rem 1.5rem;
  border-radius: 6px;
  font-weight: 700;
  z-index: 50;
  box-shadow: 0 12px 32px rgba(0,0,0,0.5);
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
