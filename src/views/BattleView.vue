<script setup lang="ts">
import { ref, computed, onMounted, nextTick, reactive } from "vue";
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
import AnimatedBackground from "../components/AnimatedBackground.vue";
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

const screenShake = ref<"" | "shake" | "shake-hard">("");
const flashOverlay = ref<{ color: string } | null>(null);

// Floating damage popups (id -> {unit, value, kind, isCrit, x, y, expires})
const popups = reactive<Array<{ id: number; unitRef: BattleUnit; value: number; kind: string; crit: boolean }>>([]);
let popupId = 0;

const skillFlashes = reactive<Array<{ id: number; unitRef: BattleUnit; element: string }>>([]);
let flashId = 0;

const stage = computed(() => STAGES_BY_ID[props.stageId]);

function pushPopup(unit: BattleUnit, value: number, kind: string, crit = false) {
  popups.push({ id: ++popupId, unitRef: unit, value, kind, crit });
  setTimeout(() => {
    const idx = popups.findIndex(p => p.id === popupId);
    if (idx >= 0) popups.splice(idx, 1);
  }, 1300);
}

function pushSkillFlash(unit: BattleUnit, element: string) {
  skillFlashes.push({ id: ++flashId, unitRef: unit, element });
  setTimeout(() => {
    const idx = skillFlashes.findIndex(f => f.id === flashId);
    if (idx >= 0) skillFlashes.splice(idx, 1);
  }, 800);
}

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

const captureItems = computed(() => Object.values(ITEMS).filter(i => i.kind === "capture" && (player.items[i.id] ?? 0) > 0));
const consumables = computed(() => Object.values(ITEMS).filter(i => i.kind === "consumable" && (player.items[i.id] ?? 0) > 0));

function pickSkill(skillId: string) { selectedSkillId.value = skillId; }
function pickTarget(u: BattleUnit) { if (u.hp > 0) selectedTarget.value = u; }

function shake(intensity: "shake" | "shake-hard" = "shake") {
  screenShake.value = intensity;
  setTimeout(() => { screenShake.value = ""; }, 600);
}

function flash(color: string) {
  flashOverlay.value = { color };
  setTimeout(() => { flashOverlay.value = null; }, 300);
}

// Capture HP changes before+after to derive damage for popup display
async function runTurn(action: PendingAction) {
  if (!battle.value) return;
  const before = new Map<BattleUnit, number>();
  for (const u of [...battle.value.allies, ...battle.value.enemies]) before.set(u, u.hp);

  executeTurn(battle.value, action);

  // Visual feedback
  let majorHit = false;
  for (const u of [...battle.value.allies, ...battle.value.enemies]) {
    const prev = before.get(u) ?? u.hp;
    const delta = u.hp - prev;
    if (delta === 0) continue;
    if (delta < 0) {
      // damage
      const skillElem = action.skillId ? SKILLS[action.skillId]?.element ?? "physical" : "physical";
      const crit = Math.abs(delta) > u.hpMax * 0.25;
      pushPopup(u, delta, skillElem, crit);
      if (Math.abs(delta) > u.hpMax * 0.4) majorHit = true;
    } else {
      pushPopup(u, delta, "heal");
    }
  }
  if (action.kind === "skill" && action.skillId) {
    const s = SKILLS[action.skillId];
    if (s && (s.kind === "attack" || s.kind === "heal")) {
      const targets = battle.value.enemies.filter(e => before.has(e) && (before.get(e)! - e.hp) > 0);
      for (const t of targets) pushSkillFlash(t, s.element);
      const elementColorMap: Record<string, string> = { fire: "#ff6b47", water: "#3aa8ff", wood: "#42d977", light: "#ffe066", dark: "#9c6cff" };
      flash(elementColorMap[s.element] ?? "#ffffff");
    }
  }
  if (majorHit) shake("shake-hard"); else if (action.kind === "skill") shake();

  await nextTick();
  scrollLog();

  if (battle.value.phase === "end_victory") handleVictory();
  else if (battle.value.phase === "end_defeat") handleDefeat();
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
    battle.value.phase = "end_victory";
    rewardSummary.value = { gold: 0, exp: 0, events: [], captured: battle.value.capturedUnit };
    handleVictory();
  } else {
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

function handleVictory() {
  if (!battle.value) return;
  const fallenEnemies = battle.value.enemies;
  const totalExp = fallenEnemies.reduce((a, b) => a + expReward(b), 0);
  const stageReward = stage.value.rewards;
  const goldReward = Math.floor(stageReward.gold / stage.value.battlesToClear);
  const expGain = Math.floor((totalExp + stageReward.expBonus / stage.value.battlesToClear) / Math.max(1, player.party.length));

  player.earnGold(goldReward);
  const events = player.distributeExp(expGain);
  player.bumpStat("battlesWon");
  if (rewardSummary.value?.captured) {
    const c = rewardSummary.value.captured;
    player.addCaptured(c.charId, c.level);
  }
  syncHpMpToPlayer();
  rewardSummary.value = { gold: goldReward, exp: expGain, events, captured: rewardSummary.value?.captured };
  const { stageCleared } = recordBattleWon(progress.value);
  battleOver.value = true;
  if (stageCleared) player.clearStage(props.stageId);
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
  for (const u of battle.value.allies) if (u.refUid) m.set(u.refUid, { hp: u.hp, mp: u.mp });
  player.syncBattleHpMp(m);
}

function nextBattle() { rewardSummary.value = null; buildBattle(); }
function exit() { router.replace({ name: "stages" }); }

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

const elementSym: Record<string, string> = { fire: "🔥", water: "💧", wood: "🌿", light: "✨", dark: "🌙" };
const skillElementColor: Record<string, string> = {
  fire: "#ff6b47", water: "#3aa8ff", wood: "#42d977", light: "#ffe066", dark: "#9c6cff",
};
function skillIconFor(s: any): string {
  if (s.kind === "heal") return "💚";
  if (s.kind === "buff") return "⬆";
  if (s.kind === "debuff") return "⬇";
  return elementSym[s.element] ?? "⚔";
}
</script>

<template>
  <div v-if="battle" class="battle-root min-h-screen relative text-white" :class="{ 'animate-shake': screenShake === 'shake', 'animate-shake-hard': screenShake === 'shake-hard' }">
    <AnimatedBackground :variant="(battle.enemies[0]?.element as any) || 'cosmic'" intensity="normal" />

    <!-- Flash overlay -->
    <div
      v-if="flashOverlay"
      class="absolute inset-0 z-40 pointer-events-none animate-flash"
      :style="{ background: flashOverlay.color, mixBlendMode: 'screen' }"
    ></div>

    <header class="battle-header">
      <div>
        <div class="text-[10px] text-pink-200/80 tracking-widest font-tech">{{ stage.id }} · CHAPTER {{ stage.chapter }}</div>
        <h2 class="font-bold text-lg">{{ stage.name }}</h2>
      </div>
      <div class="text-right">
        <div class="text-[10px] text-white/50 font-tech">BATTLE / TURN</div>
        <div class="font-tech text-base"><span class="text-pink-300 font-extrabold">{{ progress.battlesCompleted + 1 }}</span>/{{ progress.battlesToClear }} <span class="text-white/40">·</span> T{{ battle.turn }}</div>
      </div>
      <button class="btn-secondary text-xs" @click="exit">中断</button>
    </header>

    <!-- ENEMY ZONE -->
    <section class="enemy-zone">
      <div class="zone-label">ENEMY</div>
      <div class="enemy-row">
        <button
          v-for="(e, idx) in battle.enemies"
          :key="idx"
          class="unit-tile unit-tile--enemy"
          :class="[
            e.hp === 0 ? 'fallen' : '',
            selectedTarget === e ? 'unit-tile--selected' : ''
          ]"
          @click="pickTarget(e)"
          :disabled="e.hp === 0 || battleOver"
        >
          <div class="absolute top-1 left-1 flex gap-1 z-10">
            <span class="rarity-badge" :class="`rarity-badge-${e.rarity}`">{{ e.rarity }}</span>
            <span class="elem-badge" :class="`elem-${e.element}`">{{ elementSym[e.element] }}</span>
          </div>
          <div class="absolute top-1 right-1 z-10 text-right">
            <div class="text-[9px] font-tech text-white/60 leading-none">Lv</div>
            <div class="font-tech font-extrabold text-white text-lg leading-none text-glow">{{ e.level }}</div>
          </div>
          <img :src="portraitOf(e)" class="unit-img" />
          <!-- Skill flash overlay -->
          <div
            v-for="f in skillFlashes.filter(fl => fl.unitRef === e)" :key="f.id"
            class="skill-flash-circle absolute inset-0 m-auto"
            :style="{ color: skillElementColor[f.element] || '#ffffff', width: '120%', height: '120%', left: '-10%', top: '-10%' }"
          ></div>
          <!-- Damage popups -->
          <span
            v-for="p in popups.filter(pp => pp.unitRef === e)" :key="p.id"
            class="damage-popup"
            :class="[`damage-popup-${p.kind}`, p.crit ? 'text-4xl' : 'text-2xl']"
            style="left: 50%; top: 30%; transform: translate(-50%, -50%); z-index: 30;"
          >
            {{ p.value > 0 ? '+' : '' }}{{ Math.abs(p.value) }}<span v-if="p.crit" class="text-yellow-300 ml-0.5">!!</span>
          </span>
          <div class="unit-info">
            <div class="text-xs font-bold truncate">{{ e.name }}</div>
            <div class="stat-bar mt-1">
              <div class="stat-bar-fill stat-bar-fill-hp" :style="{ width: (e.hp / e.hpMax * 100) + '%', color: '#ef4444' }"></div>
            </div>
            <div class="text-[10px] text-white/60 tabular-nums">{{ e.hp }}/{{ e.hpMax }}</div>
            <div v-if="e.statusEffects.length" class="flex gap-1 mt-1">
              <span v-for="s in e.statusEffects" :key="s.status" class="status-pill">{{ s.status }}</span>
            </div>
          </div>
        </button>
      </div>
    </section>

    <!-- LOG -->
    <section class="log-section">
      <div ref="logRef" class="log-box">
        <div v-for="(l, i) in battle.log.slice(-30)" :key="i" :class="{
          'text-red-300': l.kind === 'damage',
          'text-green-300': l.kind === 'heal',
          'text-pink-200 font-bold': l.kind === 'skill',
          'text-yellow-200': l.kind === 'status' || l.kind === 'capture',
          'text-emerald-300 font-bold': l.kind === 'victory',
          'text-rose-400 font-bold': l.kind === 'defeat',
        }">{{ l.text }}</div>
      </div>
    </section>

    <!-- ALLY ZONE -->
    <section class="ally-zone">
      <div class="zone-label">PARTY</div>
      <div class="ally-row">
        <div
          v-for="(a, idx) in battle.allies"
          :key="idx"
          class="unit-tile unit-tile--ally"
          :class="[
            a.hp === 0 ? 'fallen' : '',
            a === activeAlly ? 'active-turn' : ''
          ]"
        >
          <div class="absolute top-1 left-1 flex gap-1 z-10">
            <span class="rarity-badge" :class="`rarity-badge-${a.rarity}`">{{ a.rarity }}</span>
            <span class="elem-badge" :class="`elem-${a.element}`">{{ elementSym[a.element] }}</span>
          </div>
          <div class="absolute top-1 right-1 z-10 text-right">
            <div class="text-[9px] font-tech text-white/60 leading-none">Lv</div>
            <div class="font-tech font-extrabold text-white text-lg leading-none text-glow">{{ a.level }}</div>
          </div>
          <img :src="portraitOf(a, 'battle')" class="unit-img" />
          <!-- Skill flash on heal/buff -->
          <div
            v-for="f in skillFlashes.filter(fl => fl.unitRef === a)" :key="f.id"
            class="skill-flash-circle absolute inset-0 m-auto"
            :style="{ color: skillElementColor[f.element] || '#ffffff', width: '120%', height: '120%', left: '-10%', top: '-10%' }"
          ></div>
          <span
            v-for="p in popups.filter(pp => pp.unitRef === a)" :key="p.id"
            class="damage-popup"
            :class="[`damage-popup-${p.kind}`, p.crit ? 'text-4xl' : 'text-2xl']"
            style="left: 50%; top: 30%; transform: translate(-50%, -50%); z-index: 30;"
          >
            {{ p.value > 0 ? '+' : '' }}{{ Math.abs(p.value) }}
          </span>
          <div class="unit-info">
            <div class="text-xs font-bold truncate">{{ a.name }}</div>
            <div class="stat-bar mt-1">
              <div class="stat-bar-fill stat-bar-fill-hp" :style="{ width: (a.hp / a.hpMax * 100) + '%', color: '#ef4444' }"></div>
            </div>
            <div class="text-[10px] tabular-nums text-white/70">HP {{ a.hp }}/{{ a.hpMax }}</div>
            <div class="stat-bar mt-0.5" style="height:5px">
              <div class="stat-bar-fill stat-bar-fill-mp" :style="{ width: (a.mp / Math.max(1,a.mpMax) * 100) + '%', color: '#3b82f6' }"></div>
            </div>
            <div class="text-[10px] tabular-nums text-white/70">MP {{ a.mp }}/{{ a.mpMax }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ACTION PANEL -->
    <section v-if="!battleOver" class="action-panel">
      <div v-if="activeAlly" class="action-inner">
        <div class="action-header">
          <div>
            <div class="text-[10px] text-white/50 font-tech tracking-wider">CURRENT TURN</div>
            <div class="text-base font-bold">
              <span class="text-pink-300">{{ activeAlly.name }}</span>
              <span class="text-white/40 text-xs ml-1">の行動を選択</span>
            </div>
          </div>
        </div>

        <div class="skill-grid">
          <button
            v-for="s in usableSkills"
            :key="s.id"
            class="skill-btn"
            :class="[
              selectedSkillId === s.id ? 'skill-btn--selected' : '',
              !s.usable ? 'skill-btn--disabled' : ''
            ]"
            :disabled="!s.usable || animating"
            @click="pickSkill(s.id)"
          >
            <span class="skill-btn-icon">{{ skillIconFor(s) }}</span>
            <div class="text-left flex-1 min-w-0">
              <div class="font-bold text-sm truncate">{{ s.name }}</div>
              <div class="text-[10px] text-white/55 truncate">{{ s.description }}</div>
            </div>
            <div class="skill-btn-mp" v-if="s.mpCost > 0">{{ s.mpCost }}<span class="text-[9px] text-white/40">MP</span></div>
          </button>
        </div>

        <div class="action-bottom">
          <button class="btn flex-1 text-base" :disabled="animating" @click="confirmAttack">
            ⚔ <span class="ml-1">技を使う</span>
          </button>
          <button class="btn-secondary text-sm" :disabled="animating" @click="showCaptureMenu = !showCaptureMenu; showItemMenu = false">
            🎴 捕獲
          </button>
          <button class="btn-secondary text-sm" :disabled="animating" @click="showItemMenu = !showItemMenu; showCaptureMenu = false">
            🧪 道具
          </button>
          <button class="btn-secondary text-sm" :disabled="animating" @click="confirmFlee">
            🏃 逃走
          </button>
        </div>

        <div v-if="showCaptureMenu" class="submenu animate-fade-in-up">
          <div class="text-[11px] text-white/60 mb-1.5">
            🎯 対象: <span class="font-bold text-white">{{ selectedTarget?.name ?? "未選択" }}</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button v-for="i in captureItems" :key="i.id" class="capture-btn" @click="confirmCapture(i.id)">
              <span class="font-bold">{{ i.name }}</span>
              <span class="text-white/40 mx-1">×{{ player.items[i.id] }}</span>
              <span v-if="selectedTarget" class="text-yellow-300 ml-1">{{ captureChance(selectedTarget, i.captureMultiplier ?? 1) }}%</span>
            </button>
            <span v-if="captureItems.length === 0" class="text-xs text-white/40">契約書がない…</span>
          </div>
        </div>

        <div v-if="showItemMenu" class="submenu animate-fade-in-up">
          <div class="flex flex-wrap gap-1.5">
            <button v-for="i in consumables" :key="i.id" class="capture-btn" @click="confirmItem(i.id)">
              {{ i.name }} <span class="text-white/40 mx-1">×{{ player.items[i.id] }}</span>
            </button>
            <span v-if="consumables.length === 0" class="text-xs text-white/40">道具がない…</span>
          </div>
        </div>
      </div>
    </section>

    <!-- BATTLE END OVERLAY -->
    <div v-if="battleOver" class="result-overlay">
      <div class="result-card animate-fade-in-up">
        <div class="result-banner" :class="battle.phase === 'end_victory' ? 'result-banner--victory' : 'result-banner--defeat'">
          {{ battle.phase === 'end_victory' ? '🎉 VICTORY' : '💀 DEFEAT' }}
        </div>
        <div v-if="rewardSummary && battle.phase === 'end_victory'" class="result-body">
          <div class="reward-tiles">
            <div class="reward-tile reward-tile--gold">
              <span class="text-2xl">💰</span>
              <div>
                <div class="text-[9px] text-white/60 font-tech">GOLD</div>
                <div class="font-bold text-lg">+{{ rewardSummary.gold }}</div>
              </div>
            </div>
            <div class="reward-tile reward-tile--exp">
              <span class="text-2xl">⭐</span>
              <div>
                <div class="text-[9px] text-white/60 font-tech">EXP</div>
                <div class="font-bold text-lg">+{{ rewardSummary.exp }}</div>
              </div>
            </div>
          </div>
          <div v-if="rewardSummary.captured" class="captured-banner">
            <span class="text-2xl">✨</span>
            <div>
              <div class="text-[10px] font-tech text-pink-200">CAPTURED!</div>
              <div class="font-bold text-pink-300">{{ CHARACTERS_BY_ID[rewardSummary.captured.charId].name }} を仲間にした！</div>
            </div>
          </div>
          <div v-if="rewardSummary.events?.length" class="event-list">
            <div v-for="(ev, i) in rewardSummary.events" :key="i" class="event-row">
              <div class="font-bold text-xs">{{ ev.name }}</div>
              <div v-for="(e, j) in ev.events" :key="j" class="text-[11px]">
                <span v-if="e.type === 'levelup'" class="text-green-300">↑ Lv {{ e.level }} に成長！</span>
                <span v-if="e.type === 'evolve'" class="text-pink-300 font-bold">★ 第{{ e.newStage }}形態に進化！</span>
                <span v-if="e.type === 'skill_learned'" class="text-yellow-200">✦ 『{{ SKILLS[e.skillId]?.name }}』を習得！</span>
              </div>
            </div>
          </div>
        </div>
        <div class="result-actions">
          <template v-if="battle.phase === 'end_victory' && !stageDoneAfter()">
            <button class="btn" @click="nextBattle">次のバトル ▶</button>
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

<style scoped>
.battle-root {
  display: flex; flex-direction: column;
  min-height: 100vh;
  padding-bottom: 2rem;
}

.battle-header {
  display: flex; align-items: center; gap: 1rem;
  padding: 0.6rem 1rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.9), rgba(15, 8, 30, 0.7));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky; top: 0; z-index: 20;
  flex-wrap: wrap;
}
.battle-header h2 { line-height: 1.1; }

.zone-label {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.25em;
  color: rgba(255, 255, 255, 0.4);
  padding: 0 1rem;
  margin-top: 0.5rem;
  margin-bottom: 0.25rem;
}

.enemy-zone, .ally-zone {
  padding: 0 1rem;
}
.enemy-row, .ally-row {
  display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;
}

.unit-tile {
  position: relative;
  width: 160px;
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  overflow: hidden;
  padding: 0;
  transition: all 0.25s ease;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
.unit-tile:hover:not(:disabled):not(.fallen) {
  transform: translateY(-3px);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 20px rgba(0,0,0,0.5);
}
.unit-tile--selected {
  border-color: #ff6b9d;
  box-shadow: 0 0 0 2px rgba(255,107,157,0.7), 0 0 20px rgba(255,107,157,0.5), 0 4px 12px rgba(0,0,0,0.4);
}
.unit-tile--ally { width: 180px; }

.unit-img {
  width: 100%;
  aspect-ratio: 3/4;
  object-fit: cover;
  display: block;
  filter: contrast(1.05) saturate(1.1);
}

.unit-info {
  padding: 0.5rem 0.6rem 0.6rem;
  background: linear-gradient(to top, rgba(15,8,30,0.92), rgba(15,8,30,0.55));
}

.status-pill {
  display: inline-block;
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 8px;
  background: rgba(252, 211, 77, 0.25);
  color: #fde68a;
  border: 1px solid rgba(252, 211, 77, 0.4);
}

.log-section {
  padding: 0.75rem 1rem;
}
.log-box {
  max-height: 110px;
  overflow-y: auto;
  padding: 0.6rem 0.85rem;
  font-family: 'M PLUS Rounded 1c', monospace;
  font-size: 11.5px;
  line-height: 1.55;
  background: linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 0.5rem;
  backdrop-filter: blur(8px);
}
.log-box::-webkit-scrollbar { width: 6px; }
.log-box::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }

.action-panel {
  margin: 0.75rem 1rem 0;
  padding: 0.85rem;
  background: linear-gradient(180deg, rgba(31, 21, 56, 0.92), rgba(15, 8, 30, 0.96));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.85rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 -4px 20px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.5);
}
.action-header { margin-bottom: 0.6rem; }
.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.skill-btn {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.55rem 0.65rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  text-align: left;
  transition: all 0.2s ease;
  cursor: pointer;
}
.skill-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,107,157,0.5);
  transform: translateY(-1px);
}
.skill-btn--selected {
  background: linear-gradient(135deg, rgba(255,107,157,0.25), rgba(157,107,255,0.2));
  border-color: #ff6b9d;
  box-shadow: 0 0 12px rgba(255,107,157,0.4);
}
.skill-btn--disabled { opacity: 0.4; cursor: not-allowed; }
.skill-btn-icon { font-size: 1.4rem; flex-shrink: 0; }
.skill-btn-mp {
  flex-shrink: 0;
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  color: #60a5fa;
  text-shadow: 0 0 6px rgba(96,165,250,0.7);
}

.action-bottom {
  display: flex; gap: 0.5rem; flex-wrap: wrap;
}

.submenu {
  margin-top: 0.6rem;
  padding: 0.6rem;
  background: rgba(0,0,0,0.35);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 0.5rem;
}
.capture-btn {
  padding: 0.4rem 0.7rem;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 0.4rem;
  font-size: 12px;
  transition: all 0.2s ease;
}
.capture-btn:hover {
  background: rgba(255,107,157,0.2);
  border-color: rgba(255,107,157,0.5);
}

.result-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
  z-index: 50;
  padding: 1rem;
}
.result-card {
  max-width: 460px; width: 100%;
  background: linear-gradient(180deg, rgba(31, 21, 56, 0.98), rgba(15, 8, 30, 0.98));
  border: 1px solid rgba(255, 107, 157, 0.4);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255, 107, 157, 0.3);
}
.result-banner {
  font-family: 'Orbitron', monospace;
  font-weight: 800;
  text-align: center;
  font-size: 2rem;
  padding: 1.25rem;
  letter-spacing: 0.15em;
  text-shadow: 0 0 24px currentColor;
}
.result-banner--victory {
  color: #34d399;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2));
  border-bottom: 1px solid rgba(52, 211, 153, 0.3);
}
.result-banner--defeat {
  color: #fb7185;
  background: linear-gradient(135deg, rgba(225, 29, 72, 0.3), rgba(159, 18, 57, 0.2));
  border-bottom: 1px solid rgba(251, 113, 133, 0.3);
}
.result-body { padding: 1rem 1.25rem; }
.reward-tiles { display: flex; gap: 0.75rem; }
.reward-tile {
  flex: 1;
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.5rem;
}
.reward-tile--gold { background: linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1)); border-color: rgba(251,191,36,0.4); }
.reward-tile--exp { background: linear-gradient(135deg, rgba(96,165,250,0.15), rgba(37,99,235,0.1)); border-color: rgba(96,165,250,0.4); }

.captured-banner {
  display: flex; align-items: center; gap: 0.75rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, rgba(236,72,153,0.2), rgba(192,38,211,0.15));
  border: 1px solid rgba(236,72,153,0.5);
  border-radius: 0.5rem;
  box-shadow: 0 0 12px rgba(236,72,153,0.3);
}

.event-list { margin-top: 0.75rem; }
.event-row {
  padding: 0.5rem;
  margin-bottom: 0.4rem;
  background: rgba(0,0,0,0.3);
  border-radius: 0.35rem;
  border-left: 3px solid rgba(255,107,157,0.5);
}

.result-actions {
  display: flex; gap: 0.5rem; justify-content: center;
  padding: 0.75rem 1.25rem 1.25rem;
}
</style>
