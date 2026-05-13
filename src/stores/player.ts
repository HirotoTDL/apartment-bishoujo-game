import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { PlayerSave, OwnedCharacter } from "../game/types";
import { CHARACTERS_BY_ID, type Rarity } from "../game/data/characters";
import { STAGES, FIRST_STAGE_ID } from "../game/data/stages";
import { STARTER_INVENTORY } from "../game/data/items";
import { makeOwned, applyExp, effectiveStats, maxMP } from "../game/growth";
import { saveAdapter } from "../save/adapter";

const STARTER_CHARS = ["n_001", "n_002"]; // レジデンスめぐみ + コーポマロニエ

function newSave(uid: string, displayName: string): PlayerSave {
  const owned = STARTER_CHARS.map(id => makeOwned(id, 1));
  return {
    schemaVersion: 1,
    uid,
    displayName,
    createdAt: Date.now(),
    lastPlayedAt: Date.now(),
    party: [owned[0].uid, owned[1].uid],
    owned,
    clearedStages: [],
    unlockedStages: [FIRST_STAGE_ID],
    items: { ...STARTER_INVENTORY },
    currency: { gold: 500, gems: 0 },
    rarityDexSeen: { N: 0, R: 0, SR: 0, SSR: 0, UR: 0 },
    charDexCaught: {},
    stats: { battlesWon: 0, battlesLost: 0, capturesAttempted: 0, capturesSucceeded: 0, totalPlayMinutes: 0 },
  };
}

export const usePlayerStore = defineStore("player", () => {
  const save = ref<PlayerSave | null>(null);
  const isLoading = ref(false);
  const isDirty = ref(false);

  const ready = computed(() => save.value !== null);
  const party = computed<OwnedCharacter[]>(() => {
    if (!save.value) return [];
    return save.value.party
      .map(uid => save.value!.owned.find(o => o.uid === uid))
      .filter((x): x is OwnedCharacter => !!x);
  });
  const owned = computed(() => save.value?.owned ?? []);
  const items = computed(() => save.value?.items ?? {});
  const currency = computed(() => save.value?.currency ?? { gold: 0, gems: 0 });

  async function initialize(uid: string, displayName: string) {
    isLoading.value = true;
    const remote = await saveAdapter.load(uid);
    if (remote) {
      save.value = remote;
    } else {
      save.value = newSave(uid, displayName);
      await saveAdapter.save(save.value);
    }
    isLoading.value = false;
  }

  async function persist() {
    if (!save.value) return;
    save.value.lastPlayedAt = Date.now();
    await saveAdapter.save(save.value);
    isDirty.value = false;
  }

  function ensureParty() {
    if (!save.value) return;
    const aliveParty = save.value.party.filter(uid => save.value!.owned.some(o => o.uid === uid));
    if (aliveParty.length === 0 && save.value.owned.length > 0) {
      aliveParty.push(save.value.owned[0].uid);
    }
    save.value.party = aliveParty.slice(0, 4);
  }

  function setParty(uids: string[]) {
    if (!save.value) return;
    save.value.party = uids.slice(0, 4);
    isDirty.value = true;
  }

  function addCaptured(charId: string, level: number) {
    if (!save.value) return;
    const oc = makeOwned(charId, level);
    save.value.owned.push(oc);
    save.value.charDexCaught[charId] = true;
    save.value.stats.capturesSucceeded += 1;
    isDirty.value = true;
    return oc;
  }

  function seenRarity(rarity: Rarity) {
    if (!save.value) return;
    save.value.rarityDexSeen[rarity] += 1;
    isDirty.value = true;
  }

  function consumeItem(itemId: string, qty = 1) {
    if (!save.value) return false;
    if ((save.value.items[itemId] ?? 0) < qty) return false;
    save.value.items[itemId] -= qty;
    isDirty.value = true;
    return true;
  }

  function addItem(itemId: string, qty = 1) {
    if (!save.value) return;
    save.value.items[itemId] = (save.value.items[itemId] ?? 0) + qty;
    isDirty.value = true;
  }

  function spendGold(amount: number): boolean {
    if (!save.value) return false;
    if (save.value.currency.gold < amount) return false;
    save.value.currency.gold -= amount;
    isDirty.value = true;
    return true;
  }

  function earnGold(amount: number) {
    if (!save.value) return;
    save.value.currency.gold += amount;
    isDirty.value = true;
  }

  function distributeExp(expPerChar: number) {
    if (!save.value) return [] as Array<{ name: string; events: any[] }>;
    const events: Array<{ name: string; events: any[] }> = [];
    for (const uid of save.value.party) {
      const oc = save.value.owned.find(o => o.uid === uid);
      if (!oc) continue;
      const evs = applyExp(oc, expPerChar);
      const m = CHARACTERS_BY_ID[oc.charId];
      events.push({ name: m?.name ?? oc.charId, events: evs });
    }
    isDirty.value = true;
    return events;
  }

  function syncBattleHpMp(unitMap: Map<string, { hp: number; mp: number }>) {
    if (!save.value) return;
    for (const [uid, { hp, mp }] of unitMap) {
      const oc = save.value.owned.find(o => o.uid === uid);
      if (oc) {
        oc.hp = Math.max(0, hp);
        oc.mp = Math.max(0, mp);
      }
    }
    isDirty.value = true;
  }

  function restAll() {
    if (!save.value) return;
    for (const oc of save.value.owned) {
      const m = CHARACTERS_BY_ID[oc.charId];
      if (!m) continue;
      const stats = effectiveStats(m, oc.level, oc.stage);
      oc.hp = stats.hp;
      oc.mp = maxMP(stats.mag, oc.level);
    }
    isDirty.value = true;
  }

  function clearStage(stageId: string) {
    if (!save.value) return;
    if (!save.value.clearedStages.includes(stageId)) {
      save.value.clearedStages.push(stageId);
    }
    // unlock next
    const next = STAGES.filter(s => s.unlockAfter === stageId).map(s => s.id);
    for (const n of next) {
      if (!save.value.unlockedStages.includes(n)) save.value.unlockedStages.push(n);
    }
    isDirty.value = true;
  }

  function bumpStat(key: keyof PlayerSave["stats"], delta = 1) {
    if (!save.value) return;
    save.value.stats[key] = (save.value.stats[key] ?? 0) + delta;
    isDirty.value = true;
  }

  return {
    save,
    isLoading,
    isDirty,
    ready,
    party,
    owned,
    items,
    currency,
    initialize,
    persist,
    ensureParty,
    setParty,
    addCaptured,
    seenRarity,
    consumeItem,
    addItem,
    spendGold,
    earnGold,
    distributeExp,
    syncBattleHpMp,
    restAll,
    clearStage,
    bumpStat,
  };
});
