<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { ITEMS } from "../game/data/items";
import ScenicBackground from "../components/ScenicBackground.vue";
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
  <div class="sh-root">
    <ScenicBackground scene="shop" />

    <header class="sh-header">
      <button class="sh-back" @click="router.push({ name: 'home' })"><Icon name="arrow-back" :size="14" /></button>
      <div>
        <div class="sh-eyebrow">SHOP</div>
        <h2 class="sh-title">アイテムショップ</h2>
      </div>
      <div class="sh-gold">
        <Icon name="gold" :size="18" />
        <span>{{ player.save!.currency.gold.toLocaleString() }}</span><small>G</small>
      </div>
    </header>

    <main class="sh-main">
      <div class="sh-grid-wrap">
        <div class="sh-grid">
          <div v-for="i in sellable" :key="i.id" class="sh-item" :class="`sh-item--${itemTier[i.id] || 'common'}`">
            <div class="sh-item-icon"><Icon :name="itemIcon[i.id] || 'sparkle'" :size="24" /></div>
            <div class="sh-item-body">
              <div class="sh-item-tier">{{ (itemTier[i.id] || 'common').toUpperCase() }}</div>
              <div class="sh-item-name">{{ i.name }}</div>
              <div class="sh-item-desc">{{ i.description }}</div>
              <div class="sh-item-owned">OWNED: <b>{{ player.items[i.id] ?? 0 }}</b></div>
            </div>
            <button class="sh-buy" @click="buy(i.id)" :disabled="player.save!.currency.gold < i.price!">
              <Icon name="gold" :size="14" /><span>{{ i.price }}</span>
            </button>
          </div>
        </div>
      </div>

      <transition>
        <div v-if="message" class="sh-toast" :class="message.ok ? 'sh-toast--ok' : 'sh-toast--err'">
          <Icon :name="message.ok ? 'check' : 'lock'" :size="16" /><span>{{ message.text }}</span>
        </div>
      </transition>
    </main>
  </div>
</template>

<style scoped>
.sh-root {
  position: fixed; inset: 0;
  overflow: hidden;
  color: white;
  display: flex; flex-direction: column;
}

.sh-header {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.6rem 0.9rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.92), rgba(15, 8, 30, 0.55));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
.sh-back {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 5px; color: white;
}
.sh-eyebrow { font-family: 'Orbitron', monospace; font-size: 9px; letter-spacing: 0.3em; color: rgba(255, 200, 230, 0.7); }
.sh-title { font-size: 1.1rem; font-weight: 800; margin: 1px 0 0; }
.sh-gold {
  margin-left: auto;
  display: flex; align-items: center; gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  background: linear-gradient(135deg, rgba(180,83,9,0.45), rgba(146,64,14,0.35));
  border: 1px solid rgba(251, 191, 36, 0.6);
  border-radius: 5px;
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  color: #fde68a;
  text-shadow: 0 0 8px rgba(253, 230, 138, 0.6);
}

.sh-main {
  flex: 1; min-height: 0;
  padding: 0.85rem;
  position: relative;
}
.sh-grid-wrap {
  height: 100%;
  overflow-y: auto;
  padding-right: 0.3rem;
}
.sh-grid-wrap::-webkit-scrollbar { width: 5px; }
.sh-grid-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }

.sh-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.55rem;
}

.sh-item {
  display: flex; align-items: center; gap: 0.7rem;
  padding: 0.65rem 0.85rem;
  background: linear-gradient(135deg, rgba(31, 21, 56, 0.9), rgba(20, 12, 40, 0.9));
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 7px;
  position: relative;
  overflow: hidden;
  transition: all 0.25s ease;
}
.sh-item::before {
  content: '';
  position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px;
}
.sh-item:hover { border-color: rgba(255, 200, 230, 0.25); transform: translateY(-1px); }
.sh-item--common::before { background: #94a3b8; }
.sh-item--rare::before { background: #60a5fa; box-shadow: 0 0 6px #60a5fa; }
.sh-item--epic::before { background: #c084fc; box-shadow: 0 0 6px #c084fc; }
.sh-item--legendary::before { background: linear-gradient(180deg, #fbbf24, #f87171); box-shadow: 0 0 10px #fbbf24; }

.sh-item-icon {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 200, 230, 0.85);
  flex-shrink: 0;
}
.sh-item--rare .sh-item-icon { color: #93c5fd; border-color: rgba(96, 165, 250, 0.3); }
.sh-item--epic .sh-item-icon { color: #d8b4fe; border-color: rgba(192, 132, 252, 0.3); }
.sh-item--legendary .sh-item-icon { color: #fde68a; border-color: rgba(251, 191, 36, 0.4); }

.sh-item-body { flex: 1; min-width: 0; }
.sh-item-tier { font-family: 'Orbitron', monospace; font-size: 8px; letter-spacing: 0.25em; color: rgba(255, 200, 230, 0.5); }
.sh-item--rare .sh-item-tier { color: #93c5fd; }
.sh-item--epic .sh-item-tier { color: #d8b4fe; }
.sh-item--legendary .sh-item-tier { color: #fde68a; }
.sh-item-name { font-size: 0.92rem; font-weight: 800; margin-top: 1px; }
.sh-item-desc { font-size: 10.5px; color: rgba(255, 255, 255, 0.55); margin-top: 1px; }
.sh-item-owned { font-size: 10px; color: rgba(255, 200, 230, 0.55); margin-top: 2px; }
.sh-item-owned b { color: white; font-family: 'Orbitron', monospace; }

.sh-buy {
  flex-shrink: 0;
  display: flex; align-items: center; gap: 0.3rem;
  padding: 0.5rem 0.85rem;
  background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
  border: 1px solid rgba(253, 230, 138, 0.5);
  border-radius: 5px;
  color: white;
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 0.92rem;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.3), 0 3px 8px rgba(0,0,0,0.4);
  transition: all 0.2s ease;
  clip-path: polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px);
}
.sh-buy:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.1); }
.sh-buy:disabled { opacity: 0.4; cursor: not-allowed; }

.sh-toast {
  position: absolute; bottom: 1rem; left: 50%;
  transform: translateX(-50%);
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.55rem 1.2rem;
  border-radius: 5px;
  font-weight: 700;
  z-index: 50;
  box-shadow: 0 10px 24px rgba(0,0,0,0.5);
  backdrop-filter: blur(8px);
}
.sh-toast--ok { background: linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95)); border: 1px solid rgba(52,211,153,0.6); color: white; }
.sh-toast--err { background: linear-gradient(135deg, rgba(225,29,72,0.95), rgba(159,18,57,0.95)); border: 1px solid rgba(251,113,133,0.6); color: white; }
.v-enter-active, .v-leave-active { transition: all 0.3s ease; }
.v-enter-from, .v-leave-to { opacity: 0; transform: translate(-50%, 16px); }
</style>
