<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { startStage, nextEncounter, recordBattleWon } from "../game/stageRunner";
import { toBattleUnit, expReward } from "../game/growth";
import { createBattle, executeTurn, attemptCapture, captureProbability, type BattleState, type PendingAction } from "../game/battle";
import { SKILLS } from "../game/data/skills";
import { ITEMS } from "../game/data/items";
import { STAGES_BY_ID } from "../game/data/stages";
import { CHARACTERS_BY_ID } from "../game/data/characters";
import { portraitForChar } from "../assets/placeholder";
import type { BattleUnit } from "../game/types";

const props = defineProps<{ stageId: string }>();
const router = useRouter();
const player = usePlayerStore();

const progress = ref(startStage(props.stageId));
const battle = ref<BattleState | null>(null);
const selectedSkillId = ref<string | null>(null);
const selectedTarget = ref<BattleUnit | null>(null);
const showItemMenu = ref(false);
const showCaptureMenu = ref(false);
const animating = ref(false);
const battleOver = ref(false);
const rewardSummary = ref<{ gold: number; exp: number; events: any[]; captured?: BattleUnit } | null>(null);

const stage = computed(() => STAGES_BY_ID[props.stageId]);

function buildBattle() {
  const allyUnits = player.party.map(c => toBattleUnit(c, "ally"));
  const enemies = nextEncounter(progress.value);
  for (const e of enemies) player.seenRarity(e.rarity);
  battle.value = createBattle(allyUnits, enemies);
  selectedSkillId.value = battle.value.allies[0]?.skills[0] ?? null;
  selectedTarget.value = battle.value.enemies[0] ?? null;
  battleOver.value = false;
  rewardSummary.value = null;
}

onMounted(() => {
  if (player.party.length === 0) {
    router.replace({ name: "party" });
    return;
  }
  buildBattle();
});

const activeAlly = computed(() => {
  if (!battle.value) return null;
  return battle.value.allies.find(a => a.hp > 0) ?? null;
});

const usableSkills = computed(() => {
  if (!activeAlly.value) return [];
  return activeAlly.value.skills
    .map(id => SKILLS[id])
    .filter(Boolean)
    .map(s => ({ ...s, usable: activeAlly.value!.mp >= s.mpCost }));
});

const captureItems = computed(() => {
  return Object.values(ITEMS).filter(i => i.kind === "capture" && (player.items[i.id] ?? 0) > 0);
});

const consumables = computed(() => {
  return Object.values(ITEMS).filter(i => i.kind === "consumable" && (player.items[i.id] ?? 0) > 0);
});

function pickSkill(skillId: string) {
  selectedSkillId.value = skillId;
}

function pickTarget(u: BattleUnit) {
  selectedTarget.value = u;
}

async function confirmAttack() {
  if (!battle.value || !activeAlly.value || !selectedSkillId.value) return;
  const target = selectedTarget.value && battle.value.enemies.includes(selectedTarget.value) && selectedTarget.value.hp > 0
    ? selectedTarget.value
    : battle.value.enemies.find(e => e.hp > 0)!;
  animating.value = true;
  await runTurn({ actor: activeAlly.value, kind: "skill", skillId: selectedSkillId.value, targetUnit: target });
  animating.value = false;
}

async function confirmCapture(itemId: string) {
  if (!battle.value) return;
  showCaptureMenu.value = false;
  const target = selectedTarget.value && battle.value.enemies.includes(selectedTarget.value) && selectedTarget.value.hp > 0
    ? selectedTarget.value
    : battle.value.enemies.find(e => e.hp > 0 && e.isWild)!;
  if (!target) {
    battle.value.log.push({ text: "捕獲できる対象がいない！", kind: "info" });
    return;
  }
  player.bumpStat("capturesAttempted");
  const item = ITEMS[itemId];
  player.consumeItem(itemId, 1);
  const result = attemptCapture(battle.value, target, item.captureMultiplier ?? 1);
  battle.value.log.push(...result.logs);
  if (result.success && battle.value.capturedUnit) {
    // captured: end battle as victory
    battle.value.phase = "end_victory";
    rewardSummary.value = {
      gold: 0,
      exp: 0,
      events: [],
      captured: battle.value.capturedUnit,
    };
    handleVictory();
  } else {
    // counterattack
    animating.value = true;
    await runTurn({ actor: activeAlly.value!, kind: "skill", skillId: "s_strike", targetUnit: target });
    animating.value = false;
  }
}

async function confirmItem(itemId: string) {
  if (!battle.value || !activeAlly.value) return;
  const item = ITEMS[itemId];
  if (!item) return;
  showItemMenu.value = false;
  const target = activeAlly.value;
  player.consumeItem(itemId, 1);
  animating.value = true;
  await runTurn({ actor: activeAlly.value, kind: "item", itemId, targetUnit: target });
  animating.value = false;
}

async function confirmFlee() {
  if (!battle.value || !activeAlly.value) return;
  animating.value = true;
  await runTurn({ actor: activeAlly.value, kind: "flee" });
  animating.value = false;
  if (battle.value.phase === "fled") {
    syncHpMpToPlayer();
    router.replace({ name: "stages" });
  }
}

async function runTurn(action: PendingAction) {
  if (!battle.value) return;
  executeTurn(battle.value, action);
  await nextTick();
  scrollLog();

  if (battle.value.phase === "end_victory") {
    handleVictory();
  } else if (battle.value.phase === "end_defeat") {
    handleDefeat();
  }
}

function handleVictory() {
  if (!battle.value) return;
  const fallenEnemies = battle.value.enemies;
  const totalExp = fallenEnemies.reduce((a, b) => a + expReward(b), 0);
  const stageReward = stage.value.rewards;
  const goldReward = Math.floor(stageReward.gold / stage.value.battlesToClear);
  const expReward2 = Math.floor((totalExp + stageReward.expBonus / stage.value.battlesToClear) / Math.max(1, player.party.length));

  player.earnGold(goldReward);
  const events = player.distributeExp(expReward2);
  player.bumpStat("battlesWon");

  // Mark caught char in dex
  if (rewardSummary.value?.captured) {
    const c = rewardSummary.value.captured;
    player.addCaptured(c.charId, c.level);
  }

  syncHpMpToPlayer();

  rewardSummary.value = {
    gold: goldReward,
    exp: expReward2,
    events,
    captured: rewardSummary.value?.captured,
  };

  const { stageCleared } = recordBattleWon(progress.value);
  battleOver.value = true;
  if (stageCleared) {
    player.clearStage(props.stageId);
  }
  player.persist();
}

function handleDefeat() {
  player.bumpStat("battlesLost");
  syncHpMpToPlayer();
  battleOver.value = true;
  player.persist();
}

function syncHpMpToPlayer() {
  if (!battle.value) return;
  const m = new Map<string, { hp: number; mp: number }>();
  for (const u of battle.value.allies) {
    if (u.refUid) m.set(u.refUid, { hp: u.hp, mp: u.mp });
  }
  player.syncBattleHpMp(m);
}

function nextBattle() {
  rewardSummary.value = null;
  buildBattle();
}
function exit() {
  router.replace({ name: "stages" });
}

const logRef = ref<HTMLDivElement | null>(null);
function scrollLog() {
  if (logRef.value) logRef.value.scrollTop = logRef.value.scrollHeight;
}

function portraitOf(u: BattleUnit, pose: "portrait" | "battle" | "broken_light" | "broken_heavy" = "battle"): string {
  const m = CHARACTERS_BY_ID[u.charId]!;
  const hpRatio = u.hp / Math.max(1, u.hpMax);
  const effectivePose: typeof pose = u.hp === 0 ? "broken_heavy" : hpRatio < 0.3 ? "broken_heavy" : hpRatio < 0.6 ? "broken_light" : pose;
  return portraitForChar(m.id, m.name, m.rarity, m.element, u.stage, effectivePose);
}

function captureChance(target: BattleUnit, itemMul: number) {
  return Math.round(captureProbability(target, itemMul) * 100);
}

function stageDoneAfter(): boolean {
  return progress.value.battlesCompleted >= progress.value.battlesToClear;
}
</script>

<template>
  <div v-if="battle" class="min-h-screen bg-gradient-to-b from-indigo-950 via-rose-950 to-black text-white">
    <header class="p-3 flex items-center justify-between bg-black/30">
      <div>
        <div class="font-bold">{{ stage.name }}</div>
        <div class="text-xs text-white/60">
          バトル {{ progress.battlesCompleted + 1 }} / {{ progress.battlesToClear }} ・ ターン {{ battle.turn }}
        </div>
      </div>
      <button class="btn-secondary text-xs" @click="exit">中断</button>
    </header>

    <!-- Enemy zone -->
    <section class="p-4">
      <h3 class="text-xs text-white/60 mb-2">敵</h3>
      <div class="flex gap-3 flex-wrap justify-center">
        <button
          v-for="(e, idx) in battle.enemies"
          :key="idx"
          class="panel p-2 text-center w-40 transition"
          :class="[
            e.hp === 0 ? 'opacity-30' : 'hover:scale-105 cursor-pointer',
            selectedTarget === e ? 'ring-2 ring-ui-accent' : ''
          ]"
          @click="pickTarget(e)"
          :disabled="e.hp === 0 || battleOver"
        >
          <img :src="portraitOf(e)" class="w-full rounded-md" />
          <div class="mt-1 text-sm font-bold">{{ e.name }}</div>
          <div class="text-xs text-white/60">Lv{{ e.level }} 第{{ e.stage }}形態</div>
          <div class="text-xs">
            <span :class="`rarity-${e.rarity}`">{{ e.rarity }}</span>
          </div>
          <div class="h-2 bg-black/40 rounded overflow-hidden mt-1">
            <div class="h-full bg-red-500" :style="{ width: (e.hp / e.hpMax * 100) + '%' }"></div>
          </div>
          <div class="text-xs tabular-nums text-white/70">{{ e.hp }} / {{ e.hpMax }}</div>
          <div v-if="e.statusEffects.length" class="text-xs text-yellow-200 mt-1">
            {{ e.statusEffects.map(s => s.status).join(",") }}
          </div>
        </button>
      </div>
    </section>

    <!-- Battle log -->
    <section class="px-4">
      <div ref="logRef" class="panel max-h-32 overflow-y-auto text-xs p-2 font-mono whitespace-pre-wrap">
        <div v-for="(l, i) in battle.log" :key="i" :class="{
          'text-red-300': l.kind === 'damage',
          'text-green-300': l.kind === 'heal',
          'text-pink-200': l.kind === 'skill',
          'text-yellow-200': l.kind === 'status' || l.kind === 'capture',
          'text-emerald-300 font-bold': l.kind === 'victory',
          'text-rose-400 font-bold': l.kind === 'defeat',
        }">{{ l.text }}</div>
      </div>
    </section>

    <!-- Ally zone -->
    <section class="p-4">
      <h3 class="text-xs text-white/60 mb-2">パーティ</h3>
      <div class="flex gap-3 flex-wrap">
        <div
          v-for="(a, idx) in battle.allies"
          :key="idx"
          class="panel p-2 w-44 transition"
          :class="a === activeAlly ? 'ring-2 ring-blue-400' : 'opacity-90'"
        >
          <img :src="portraitOf(a, 'battle')" class="w-full rounded-md" />
          <div class="mt-1 text-sm font-bold truncate">{{ a.name }}</div>
          <div class="text-xs text-white/60">Lv{{ a.level }} 第{{ a.stage }}</div>
          <div class="h-2 bg-black/40 rounded overflow-hidden mt-1">
            <div class="h-full bg-red-500" :style="{ width: (a.hp / a.hpMax * 100) + '%' }"></div>
          </div>
          <div class="text-xs tabular-nums">HP {{ a.hp }}/{{ a.hpMax }}</div>
          <div class="h-1.5 bg-black/40 rounded overflow-hidden mt-1">
            <div class="h-full bg-blue-400" :style="{ width: (a.mp / Math.max(1,a.mpMax) * 100) + '%' }"></div>
          </div>
          <div class="text-xs tabular-nums">MP {{ a.mp }}/{{ a.mpMax }}</div>
        </div>
      </div>
    </section>

    <!-- Action panel -->
    <section v-if="!battleOver" class="p-4 border-t border-white/10 bg-black/40">
      <div v-if="activeAlly">
        <div class="text-sm mb-2 text-white/70">
          <span class="font-bold">{{ activeAlly.name }}</span> のターン
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <button
            v-for="s in usableSkills"
            :key="s.id"
            class="panel p-2 text-left text-sm transition"
            :class="[
              selectedSkillId === s.id ? 'ring-2 ring-ui-accent' : '',
              s.usable ? 'hover:bg-white/5 cursor-pointer' : 'opacity-40 cursor-not-allowed'
            ]"
            :disabled="!s.usable || animating"
            @click="pickSkill(s.id)"
          >
            <div class="font-bold">{{ s.name }}</div>
            <div class="text-xs text-white/60">{{ s.description }}</div>
            <div class="text-xs text-blue-300 mt-1">MP {{ s.mpCost }}</div>
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="btn" :disabled="animating" @click="confirmAttack">▶ 技を使う</button>
          <button class="btn-secondary" :disabled="animating" @click="showCaptureMenu = !showCaptureMenu; showItemMenu = false">🎴 捕獲</button>
          <button class="btn-secondary" :disabled="animating" @click="showItemMenu = !showItemMenu; showCaptureMenu = false">🧪 アイテム</button>
          <button class="btn-secondary" :disabled="animating" @click="confirmFlee">🏃 逃げる</button>
        </div>

        <!-- Capture submenu -->
        <div v-if="showCaptureMenu" class="mt-3 panel p-3">
          <div class="text-xs text-white/60 mb-2">
            対象: {{ selectedTarget?.name ?? "未選択" }}（敵をクリックして選択）
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="i in captureItems"
              :key="i.id"
              class="btn-secondary text-sm"
              @click="confirmCapture(i.id)"
            >
              {{ i.name }} (×{{ player.items[i.id] }})
              <span v-if="selectedTarget" class="ml-1 text-yellow-200">
                {{ captureChance(selectedTarget, i.captureMultiplier ?? 1) }}%
              </span>
            </button>
            <span v-if="captureItems.length === 0" class="text-xs text-white/40">契約書がない</span>
          </div>
        </div>

        <!-- Item submenu -->
        <div v-if="showItemMenu" class="mt-3 panel p-3">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="i in consumables"
              :key="i.id"
              class="btn-secondary text-sm"
              @click="confirmItem(i.id)"
            >
              {{ i.name }} (×{{ player.items[i.id] }})
            </button>
            <span v-if="consumables.length === 0" class="text-xs text-white/40">アイテムがない</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Battle over overlay -->
    <div v-if="battleOver" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div class="panel p-6 max-w-md w-full text-center">
        <h2 class="text-2xl font-bold mb-3" :class="battle.phase === 'end_victory' ? 'text-emerald-300' : 'text-rose-300'">
          {{ battle.phase === 'end_victory' ? '勝利！' : '敗北…' }}
        </h2>
        <div v-if="rewardSummary && battle.phase === 'end_victory'" class="space-y-1 text-sm">
          <div>獲得ゴールド: <span class="text-yellow-300">{{ rewardSummary.gold }} G</span></div>
          <div>獲得経験値: <span class="text-blue-300">{{ rewardSummary.exp }} EXP</span></div>
          <div v-if="rewardSummary.captured" class="mt-2 text-pink-300 font-bold">
            🎉 {{ CHARACTERS_BY_ID[rewardSummary.captured.charId].name }} を仲間にした！
          </div>
          <div v-if="rewardSummary.events?.length" class="mt-3 text-left space-y-1">
            <div v-for="(ev, i) in rewardSummary.events" :key="i" class="text-xs">
              <div class="font-bold">{{ ev.name }}</div>
              <div v-for="(e, j) in ev.events" :key="j">
                <span v-if="e.type === 'levelup'" class="text-green-300">Lv {{ e.level }} に上昇！</span>
                <span v-if="e.type === 'evolve'" class="text-pink-300 font-bold">★第{{ e.newStage }}形態に進化！</span>
                <span v-if="e.type === 'skill_learned'" class="text-yellow-200">『{{ SKILLS[e.skillId]?.name }}』を覚えた！</span>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 flex gap-2 justify-center">
          <template v-if="battle.phase === 'end_victory' && !stageDoneAfter()">
            <button class="btn" @click="nextBattle">次のバトル</button>
            <button class="btn-secondary" @click="exit">退却</button>
          </template>
          <template v-else>
            <button class="btn" @click="exit">{{ battle.phase === 'end_defeat' ? 'ホームに戻る' : 'ステージ選択へ' }}</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
