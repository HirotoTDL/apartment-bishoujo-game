<script setup lang="ts">
import { ref, computed, onMounted, nextTick, reactive } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { startStage, nextEncounter, recordBattleWon } from "../game/stageRunner";
import { toBattleUnit, expReward } from "../game/growth";
import {
  createBattle, planAction, planEnemies, resolveTurn,
  attemptCapture, captureProbability,
  SKILLS, type BattleState,
} from "../game/battle";
import { ROLE_LABEL } from "../game/data/skills";
import { ITEMS } from "../game/data/items";
import { STAGES_BY_ID } from "../game/data/stages";
import { CHARACTERS_BY_ID } from "../game/data/characters";
import { portraitForChar } from "../assets/placeholder";
import ScenicBackground from "../components/ScenicBackground.vue";
import Icon from "../components/Icon.vue";
import RarityStars from "../components/RarityStars.vue";
import BattleEffect from "../components/BattleEffect.vue";
import type { BattleUnit } from "../game/types";

const props = defineProps<{ stageId: string }>();
const router = useRouter();
const player = usePlayerStore();

const progress = ref(startStage(props.stageId));
const battle = ref<BattleState | null>(null);
const battleOver = ref(false);
const rewardSummary = ref<{ gold: number; exp: number; events: any[]; captured?: BattleUnit } | null>(null);

// Planning UI state
const activePlannerIdx = ref(0);  // which ally is currently being planned
const selectedSkillId = ref<string | null>(null);
const selectedTarget = ref<BattleUnit | null>(null);
const showCaptureMenu = ref(false);
const showItemMenu = ref(false);

// Animation overlays
const screenShake = ref<"" | "shake" | "shake-hard">("");
const flashOverlay = ref<{ color: string } | null>(null);
const banner = ref<{ attacker: string; skill: string; targets: string; element: string; kind: "skill" | "ult" } | null>(null);
const ultCutin = ref<{ name: string; skill: string; portrait: string; element: string; rarity: string; role: string } | null>(null);
const popups = reactive<Array<{ id: number; unit: BattleUnit; value: number; kind: string; crit: boolean; attackerInitial?: string }>>([]);
let popupId = 0;
const skillFlashes = reactive<Array<{ id: number; unit: BattleUnit; element: string }>>([]);
let flashId = 0;
const effects = reactive<Array<{
  id: number;
  kind: "projectile" | "impact";
  element: string;
  fromX: number; fromY: number;
  toX: number; toY: number;
  duration: number;
}>>([]);
let effectId = 0;
const animating = ref(false);

// Unit DOM refs for effect targeting (BattleUnit -> HTMLElement)
const unitRefs = new Map<BattleUnit, HTMLElement>();
const battleRootEl = ref<HTMLElement | null>(null);
function setUnitRef(unit: BattleUnit, el: any) {
  if (el && el instanceof HTMLElement) unitRefs.set(unit, el);
  else unitRefs.delete(unit);
}
function unitPos(unit: BattleUnit): { x: number; y: number } | null {
  const el = unitRefs.get(unit);
  const root = battleRootEl.value;
  if (!el || !root) return null;
  const er = el.getBoundingClientRect();
  const rr = root.getBoundingClientRect();
  const scaleStr = getComputedStyle(document.documentElement).getPropertyValue("--ui-scale").trim() || "1";
  const scale = Number(scaleStr) || 1;
  return {
    x: (er.left + er.width / 2 - rr.left) / scale,
    y: (er.top + er.height / 2 - rr.top) / scale,
  };
}
function wait(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function fireEffect(kind: "projectile" | "impact", element: string, from: {x:number;y:number}, to: {x:number;y:number}, duration: number) {
  const id = ++effectId;
  effects.push({ id, kind, element, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y, duration });
  setTimeout(() => {
    const i = effects.findIndex(e => e.id === id);
    if (i >= 0) effects.splice(i, 1);
  }, duration + 80);
}

const stage = computed(() => STAGES_BY_ID[props.stageId]);

function pushPopup(unit: BattleUnit, value: number, kind: string, crit = false, attackerInitial?: string) {
  popups.push({ id: ++popupId, unit, value, kind, crit, attackerInitial });
  setTimeout(() => {
    const idx = popups.findIndex(p => p.id === popupId);
    if (idx >= 0) popups.splice(idx, 1);
  }, 1300);
}
function pushSkillFlash(unit: BattleUnit, element: string) {
  skillFlashes.push({ id: ++flashId, unit, element });
  setTimeout(() => {
    const idx = skillFlashes.findIndex(f => f.id === flashId);
    if (idx >= 0) skillFlashes.splice(idx, 1);
  }, 800);
}

function buildBattle() {
  const allyUnits = player.party.map(c => toBattleUnit(c, "ally"));
  const { enemies, type } = nextEncounter(progress.value);
  for (const e of enemies) player.seenRarity(e.rarity);
  battle.value = createBattle(allyUnits, enemies, type);
  displayHp.clear();
  displayMp.clear();
  snapshotDisplayBars();
  resetPlanner();
  battleOver.value = false;
  rewardSummary.value = null;
}

// "Display" HP/MP track what the player sees as the bar value, separate
// from the engine's authoritative state. This lets us animate the bar
// drain AFTER the skill projectile/impact has played, even though the
// engine has already mutated u.hp synchronously.
const displayHp = reactive(new Map<BattleUnit, number>());
const displayMp = reactive(new Map<BattleUnit, number>());

function getDisplayHp(u: BattleUnit): number {
  const v = displayHp.get(u);
  return v != null ? v : u.hp;
}
function getDisplayMp(u: BattleUnit): number {
  const v = displayMp.get(u);
  return v != null ? v : u.mp;
}
function snapshotDisplayBars() {
  if (!battle.value) return;
  for (const u of [...battle.value.allies, ...battle.value.enemies]) {
    displayHp.set(u, u.hp);
    displayMp.set(u, u.mp);
  }
}
function commitDisplayHp(u: BattleUnit) { displayHp.set(u, u.hp); }
function commitDisplayMp(u: BattleUnit) { displayMp.set(u, u.mp); }

// User-toggled battle speed mode (persisted in localStorage)
// "quick" = always snappy (good for grinding)
// "cinematic" = always rich (good for boss savouring)
// "auto" = scales by encounter type (default)
const BATTLE_SPEED_KEY = "battle_speed_mode";
type SpeedMode = "auto" | "quick" | "cinematic";
const speedMode = ref<SpeedMode>(
  (localStorage.getItem(BATTLE_SPEED_KEY) as SpeedMode) || "auto"
);
function setSpeedMode(m: SpeedMode) {
  speedMode.value = m;
  localStorage.setItem(BATTLE_SPEED_KEY, m);
}

// During an attack scene we also boost the "active" feeling by remembering
// the current attacker so the UI can highlight them and dim others.
const activeAttacker = ref<BattleUnit | null>(null);
const activeTargets = ref<Set<BattleUnit>>(new Set());

// Animation pacing multipliers — combine encounter type with user speed mode
function pace(ms: number): number {
  let mul: number;
  if (speedMode.value === "quick") {
    mul = 0.40;
  } else if (speedMode.value === "cinematic") {
    mul = 1.0;
  } else {
    const t = battle.value?.encounterType ?? "trash";
    mul = t === "trash" ? 0.55 : t === "elite" ? 0.85 : 1.0;
  }
  return Math.max(80, Math.floor(ms * mul));
}

function resetPlanner() {
  activePlannerIdx.value = 0;
  if (battle.value) {
    const a = aliveAllies.value[0];
    if (a) {
      selectedSkillId.value = a.skills[0] ?? null;
      selectedTarget.value = battle.value.enemies.find(e => e.hp > 0) ?? null;
    }
  }
  showCaptureMenu.value = false;
  showItemMenu.value = false;
}

onMounted(() => {
  if (player.party.length === 0) { router.replace({ name: "party" }); return; }
  buildBattle();
});

const aliveAllies = computed(() => battle.value?.allies.filter(a => a.hp > 0) ?? []);
const aliveEnemies = computed(() => battle.value?.enemies.filter(e => e.hp > 0) ?? []);

const currentPlanner = computed(() => aliveAllies.value[activePlannerIdx.value] ?? null);
const isLastPlanner = computed(() => activePlannerIdx.value >= aliveAllies.value.length - 1);

const usableSkills = computed(() => {
  if (!currentPlanner.value) return [];
  const list = currentPlanner.value.skills
    .map(id => SKILLS[id])
    .filter(Boolean)
    .map(s => ({ ...s, usable: currentPlanner.value!.mp >= s.mpCost && (currentPlanner.value!.cooldowns[s.id] ?? 0) === 0 }));
  // Append ult if ready
  if (currentPlanner.value.ultGauge >= 100) {
    const ult = SKILLS[currentPlanner.value.ultId];
    if (ult) list.push({ ...ult, usable: true });
  }
  return list;
});

const captureItems = computed(() => Object.values(ITEMS).filter(i => i.kind === "capture" && (player.items[i.id] ?? 0) > 0));
const consumables = computed(() => Object.values(ITEMS).filter(i => i.kind === "consumable" && (player.items[i.id] ?? 0) > 0));


function pickSkill(skillId: string) {
  selectedSkillId.value = skillId;
  // Auto-pick target based on skill target type
  const s = SKILLS[skillId];
  if (!s || !battle.value) return;
  if (s.target === "single_enemy") {
    selectedTarget.value = battle.value.enemies.find(e => e.hp > 0) ?? null;
  } else if (s.target === "single_ally" || s.target === "lowest_hp_ally") {
    selectedTarget.value = aliveAllies.value.slice().sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0] ?? null;
  } else if (s.target === "self") {
    selectedTarget.value = currentPlanner.value;
  } else if (s.target === "single_dead_ally") {
    selectedTarget.value = battle.value.allies.find(a => a.hp === 0) ?? null;
  } else {
    selectedTarget.value = null;
  }
}
function pickTarget(u: BattleUnit) {
  if (!u) return;
  const skill = selectedSkillId.value ? SKILLS[selectedSkillId.value] : null;
  if (!skill) return;
  // Validate target type
  const isEnemy = u.side === "enemy";
  switch (skill.target) {
    case "single_enemy":
      if (isEnemy && u.hp > 0) selectedTarget.value = u;
      break;
    case "single_ally":
    case "lowest_hp_ally":
      if (!isEnemy && u.hp > 0) selectedTarget.value = u;
      break;
    case "single_dead_ally":
      if (!isEnemy && u.hp === 0) selectedTarget.value = u;
      break;
    // self / all_* targets ignore click
  }
}

// Can the user pick this ally as a target right now?
function canPickAlly(u: BattleUnit): boolean {
  if (!selectedSkillId.value) return false;
  const s = SKILLS[selectedSkillId.value];
  if (!s) return false;
  if (s.target === "single_ally" || s.target === "lowest_hp_ally") return u.hp > 0;
  if (s.target === "single_dead_ally") return u.hp === 0;
  return false;
}

function commitCurrentPlan() {
  if (!battle.value || !currentPlanner.value || !selectedSkillId.value) return;
  const s = SKILLS[selectedSkillId.value];
  if (!s) return;
  // Resolve target list
  let targets: BattleUnit[] = [];
  switch (s.target) {
    case "single_enemy": targets = selectedTarget.value && selectedTarget.value.hp > 0 ? [selectedTarget.value] : battle.value.enemies.filter(e => e.hp > 0).slice(0, 1); break;
    case "all_enemies": targets = battle.value.enemies.filter(e => e.hp > 0); break;
    case "single_ally":
    case "lowest_hp_ally":
      targets = selectedTarget.value && selectedTarget.value.hp > 0 ? [selectedTarget.value] : aliveAllies.value.slice(0, 1);
      break;
    case "all_allies": targets = aliveAllies.value; break;
    case "self": targets = [currentPlanner.value]; break;
    case "single_dead_ally":
      targets = selectedTarget.value && selectedTarget.value.hp === 0 ? [selectedTarget.value] : battle.value.allies.filter(a => a.hp === 0).slice(0, 1);
      break;
  }
  planAction(battle.value, {
    actor: currentPlanner.value,
    kind: "skill",
    skillId: selectedSkillId.value,
    targetUnits: targets,
  });
  advancePlanner();
}

function setDefendPlan() {
  if (!battle.value || !currentPlanner.value) return;
  planAction(battle.value, { actor: currentPlanner.value, kind: "defend" });
  advancePlanner();
}

function advancePlanner() {
  if (isLastPlanner.value) {
    executeTurn();
  } else {
    activePlannerIdx.value += 1;
    const a = currentPlanner.value;
    if (a) {
      selectedSkillId.value = a.skills[0] ?? null;
      selectedTarget.value = battle.value!.enemies.find(e => e.hp > 0) ?? null;
    }
  }
}

function goBackPlanner() {
  if (activePlannerIdx.value > 0) {
    activePlannerIdx.value -= 1;
    const a = currentPlanner.value;
    if (a) {
      selectedSkillId.value = a.skills[0] ?? null;
    }
  }
}

async function executeTurn() {
  if (!battle.value) return;
  animating.value = true;
  planEnemies(battle.value);
  const events = resolveTurn(battle.value);

  // Group events by acting unit + skill for cinematic pacing
  // (each contiguous run of events from the same actor with the same skillId
  // is one "attack scene")
  let i = 0;
  while (i < events.length) {
    const ev = events[i];

    // Standalone events: ult_used (cut-in), broken, fallen, status_applied
    if (ev.type === "ult_used" && ev.actor && ev.skillId) {
      const sk = SKILLS[ev.skillId];
      const m = ev.actor.charId ? CHARACTERS_BY_ID[ev.actor.charId] : null;
      if (sk && m) {
        ultCutin.value = {
          name: ev.actor.name,
          skill: sk.name,
          portrait: portraitForChar(m.id, m.name, m.rarity, m.element, ev.actor.stage, "battle"),
          element: sk.element,
          rarity: m.rarity,
          role: m.role ?? "striker",
        };
        // ULT always uses full cinematic pacing regardless of encounter type
        await wait(1900);
        ultCutin.value = null;
        await wait(120);
      }
      i++;
      continue;
    }

    if (ev.type === "broken" && ev.unit) {
      shake("shake-hard");
      await wait(pace(550));
      i++;
      continue;
    }

    // Find the run of contiguous attack/heal events from the same actor/skill
    if ((ev.type === "damage" || ev.type === "heal") && ev.actor && ev.skillId) {
      const actor = ev.actor;
      const skillId = ev.skillId;
      const skill = SKILLS[skillId];
      // Collect all events that belong to this actor's current skill
      const scene: typeof events = [];
      let j = i;
      while (j < events.length) {
        const e = events[j];
        if ((e.type === "damage" || e.type === "heal") && e.actor === actor && e.skillId === skillId) {
          scene.push(e);
          j++;
        } else break;
      }
      i = j;
      // Highlight attacker + targets (visual clarity)
      activeAttacker.value = actor;
      activeTargets.value = new Set(scene.map(s => s.unit!).filter(Boolean));
      // Commit attacker's MP consumption now (visible on banner)
      commitDisplayMp(actor);
      // Show the attack banner
      const targetNames = scene.map(s => s.unit?.name).filter(Boolean);
      const tStr = targetNames.length > 2
        ? `${targetNames[0]} 他 ${targetNames.length - 1}体`
        : targetNames.join(", ");
      banner.value = {
        attacker: actor.name,
        skill: skill?.name ?? "攻撃",
        targets: tStr,
        element: skill?.element ?? "light",
        kind: skill?.ultimate ? "ult" : "skill",
      };
      await wait(pace(700));
      // Show projectile/impact for each target
      const fromPos = unitPos(actor);
      for (const s of scene) {
        if (!s.unit) continue;
        const toPos = unitPos(s.unit);
        if (fromPos && toPos) {
          fireEffect("projectile", skill?.element ?? "light", fromPos, toPos, pace(380));
          await wait(pace(280));
          fireEffect("impact", skill?.element ?? "light", fromPos, toPos, pace(550));
        }
        // Damage popup + shake
        const initial = actor.name.slice(0, 2);
        if (s.type === "damage" && s.amount && s.unit) {
          pushPopup(s.unit, -s.amount, skill?.element ?? "physical", s.isCritical ?? false, initial);
          pushSkillFlash(s.unit, skill?.element ?? "light");
          commitDisplayHp(s.unit);  // HP bar drops AFTER projectile/impact, not before
          if (s.amount > 100 || s.isCritical) shake("shake-hard"); else shake("shake");
          flash(({ fire: "#ff6b47", water: "#3aa8ff", wood: "#42d977", light: "#ffe066", dark: "#9c6cff" } as any)[skill?.element ?? "light"] ?? "#fff");
        } else if (s.type === "heal" && s.amount && s.unit) {
          pushPopup(s.unit, s.amount, "heal", false, initial);
          commitDisplayHp(s.unit);
        }
        await wait(scene.length > 1 ? pace(200) : pace(380));
      }
      banner.value = null;
      activeAttacker.value = null;
      activeTargets.value = new Set();
      await wait(pace(180));
      continue;
    }

    // Heal-only events (regen tick etc.) without explicit attack scene
    if (ev.type === "heal" && ev.amount && ev.unit) {
      pushPopup(ev.unit, ev.amount, "heal");
      await wait(pace(150));
    }
    if (ev.type === "status_tick" && ev.amount && ev.unit) {
      pushPopup(ev.unit, ev.status === "regen" ? ev.amount : -ev.amount, ev.status === "regen" ? "heal" : "physical");
      await wait(pace(150));
    }
    if (ev.type === "fallen" && ev.unit) {
      shake("shake");
      await wait(pace(280));
    }
    i++;
  }

  await nextTick();
  scrollLog();
  if (battle.value.phase === "end_victory") handleVictory();
  else if (battle.value.phase === "end_defeat") handleDefeat();
  else resetPlanner();
  animating.value = false;
}

function shake(intensity: "shake" | "shake-hard" = "shake") {
  screenShake.value = intensity;
  setTimeout(() => { screenShake.value = ""; }, 600);
}
function flash(color: string) {
  flashOverlay.value = { color };
  setTimeout(() => { flashOverlay.value = null; }, 300);
}

async function confirmCapture(itemId: string) {
  if (!battle.value || !selectedTarget.value) return;
  showCaptureMenu.value = false;
  player.bumpStat("capturesAttempted");
  const item = ITEMS[itemId];
  player.consumeItem(itemId, 1);
  const result = attemptCapture(battle.value, selectedTarget.value, item.captureMultiplier ?? 1);
  if (result.success && battle.value.capturedUnit) {
    battle.value.phase = "end_victory";
    rewardSummary.value = { gold: 0, exp: 0, events: [], captured: battle.value.capturedUnit };
    handleVictory();
  } else {
    // failed capture wastes the action — execute enemy turn
    executeTurn();
  }
}

async function confirmItem(itemId: string) {
  if (!battle.value || !currentPlanner.value) return;
  showItemMenu.value = false;
  const item = ITEMS[itemId];
  if (!item) return;
  player.consumeItem(itemId, 1);
  // Apply consumable effect directly
  if (item.effect?.targetStat === "hp" && item.effect.amount) {
    const heal = Math.min(currentPlanner.value.hpMax - currentPlanner.value.hp, item.effect.amount);
    currentPlanner.value.hp += heal;
    pushPopup(currentPlanner.value, heal, "heal");
  } else if (item.effect?.targetStat === "mp" && item.effect.amount) {
    const heal = Math.min(currentPlanner.value.mpMax - currentPlanner.value.mp, item.effect.amount);
    currentPlanner.value.mp += heal;
  }
  advancePlanner();
}

function confirmFlee() {
  if (!battle.value) return;
  if (battle.value.enemies.every(e => e.isWild)) {
    if (Math.random() < 0.6) {
      battle.value.phase = "fled";
      syncHpMpToPlayer();
      router.replace({ name: "stages" });
    } else {
      battle.value.log.push({ text: "逃げられない！", kind: "info" });
      executeTurn();
    }
  } else {
    battle.value.log.push({ text: "ボス戦からは逃げられない！", kind: "info" });
  }
}

function handleVictory() {
  if (!battle.value) return;
  const totalExp = battle.value.enemies.reduce((a, b) => a + expReward(b), 0);
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
function handleDefeat() { player.bumpStat("battlesLost"); syncHpMpToPlayer(); battleOver.value = true; player.persist(); }
function syncHpMpToPlayer() {
  if (!battle.value) return;
  const m = new Map<string, { hp: number; mp: number }>();
  for (const u of battle.value.allies) if (u.refUid) m.set(u.refUid, { hp: u.hp, mp: u.mp });
  player.syncBattleHpMp(m);
}
function nextBattle() { rewardSummary.value = null; buildBattle(); }
function exit() { router.replace({ name: "stages" }); }

function scrollLog() { scrollSideLog(); }

function portraitOf(u: BattleUnit, pose: "portrait" | "battle" | "broken_light" | "broken_heavy" = "battle"): string {
  const m = CHARACTERS_BY_ID[u.charId]!;
  const hpRatio = u.hp / Math.max(1, u.hpMax);
  const effectivePose: typeof pose = u.hp === 0 ? "broken_heavy" : hpRatio < 0.3 ? "broken_heavy" : hpRatio < 0.6 ? "broken_light" : pose;
  return portraitForChar(m.id, m.name, m.rarity, m.element, u.stage, effectivePose);
}

function captureChance(target: BattleUnit, itemMul: number) { return Math.round(captureProbability(target, itemMul) * 100); }
function stageDoneAfter(): boolean { return progress.value.battlesCompleted >= progress.value.battlesToClear; }

function skillIconFor(s: any): string {
  if (s.ultimate) return "sparkle";
  if (s.kind === "heal") return "heart";
  if (s.kind === "buff") return "arrow-up";
  if (s.kind === "debuff") return "arrow-down";
  if (s.kind === "support") return "shield";
  if (s.element && ["fire", "water", "wood", "light", "dark"].includes(s.element)) return s.element;
  return "sword";
}

const skillElementColor: Record<string, string> = { fire: "#ff6b47", water: "#3aa8ff", wood: "#42d977", light: "#ffe066", dark: "#9c6cff" };

// Skill detail hover state
const hoveredSkillId = ref<string | null>(null);
const hoveredSkill = computed(() => hoveredSkillId.value ? SKILLS[hoveredSkillId.value] : null);
function statusJp(id: string): string {
  return statusName(id);
}

// Enriched battle log: attach actor + side info to each line
// Detection: a line that starts with a unit's name is attributed to them.
const enrichedLog = computed(() => {
  if (!battle.value) return [] as Array<{
    text: string; kind?: string;
    actor?: BattleUnit; side: "ally" | "enemy" | "neutral";
  }>;
  const allUnits = [...battle.value.allies, ...battle.value.enemies];
  return battle.value.log.slice(-40).map(l => {
    // Try to find a unit whose name appears at the start of the line
    let actor: BattleUnit | undefined;
    for (const u of allUnits) {
      if (l.text.startsWith(u.name)) { actor = u; break; }
    }
    const side = actor?.side ?? "neutral";
    return { ...l, actor, side };
  });
});

// Auto-scroll the side log when new entries arrive
const sideLogRef = ref<HTMLDivElement | null>(null);
function scrollSideLog() {
  if (sideLogRef.value) sideLogRef.value.scrollTop = sideLogRef.value.scrollHeight;
}

function statusName(id: string): string {
  const m: Record<string, string> = {
    burn: "やけど", freeze: "凍結", poison: "毒",
    stun: "スタン", silence: "沈黙",
    weaken: "攻撃↓", fragile: "防御↓", slow: "速度↓",
    regen: "再生", shield: "盾", taunt: "挑発", barrier: "障壁",
    atk_up: "攻↑", atk_down: "攻↓", def_up: "防↑", def_down: "防↓",
    spd_up: "速↑", spd_down: "速↓", mag_up: "魔↑", mag_down: "魔↓",
  };
  return m[id] ?? id;
}

const isWeaknessTo = (attackerElem: string, defenderElem: string) => {
  const W: Record<string, string> = { fire: "wood", wood: "water", water: "fire", light: "dark", dark: "light" };
  return W[attackerElem] === defenderElem;
};
</script>

<template>
  <div v-if="battle" ref="battleRootEl" class="bt-root" :class="{ 'animate-shake': screenShake === 'shake', 'animate-shake-hard': screenShake === 'shake-hard' }">
    <ScenicBackground scene="arena" />

    <div v-if="flashOverlay" class="bt-flash" :style="{ background: flashOverlay.color }"></div>

    <!-- Skill banner — attacker → target overlay -->
    <transition name="banner">
      <div v-if="banner" class="bt-banner" :class="[`bt-banner-${banner.kind}`, `bt-banner-${banner.element}`]">
        <div class="bt-banner-row">
          <span class="bt-banner-attacker">{{ banner.attacker }}</span>
          <span class="bt-banner-arrow">▶</span>
          <span class="bt-banner-skill">{{ banner.skill }}</span>
          <span class="bt-banner-arrow">▶</span>
          <span class="bt-banner-target">{{ banner.targets }}</span>
        </div>
      </div>
    </transition>

    <!-- ULT FULLSCREEN CUT-IN (multi-phase) -->
    <transition name="cutin">
      <div v-if="ultCutin" class="ult-overlay" :class="`ult-elem-${ultCutin.element}`">
        <!-- 1. Dark wash + radial pulse from center -->
        <div class="ult-blackout"></div>
        <div class="ult-radial"></div>
        <!-- 2. Halftone dot pattern background -->
        <div class="ult-halftone"></div>
        <!-- 3. Diagonal speed-stripes rushing in -->
        <div class="ult-stripes">
          <span v-for="i in 7" :key="'s' + i" :class="`stripe-${i}`"></span>
        </div>
        <!-- 4. Concentric energy rings expanding outward -->
        <div class="ult-rings">
          <span></span><span></span><span></span>
        </div>
        <!-- 5. Top/bottom cinematic letterbox bars -->
        <div class="ult-bar ult-bar-top"></div>
        <div class="ult-bar ult-bar-bottom"></div>
        <!-- 6. Lightning bolts -->
        <svg class="ult-lightning" viewBox="0 0 1280 720" preserveAspectRatio="none">
          <path d="M 100,0 L 200,180 L 130,200 L 280,400 L 200,420 L 350,720" stroke="currentColor" stroke-width="3" fill="none" />
          <path d="M 1180,0 L 1080,180 L 1150,200 L 1000,400 L 1080,420 L 930,720" stroke="currentColor" stroke-width="3" fill="none" />
          <path d="M 640,-50 L 700,250 L 590,300 L 720,560" stroke="currentColor" stroke-width="2" fill="none" opacity="0.5" />
        </svg>
        <!-- 7. Big character portrait with hex-frame -->
        <div class="ult-portrait-wrap">
          <div class="ult-portrait-aura"></div>
          <div class="ult-portrait-frame">
            <img :src="ultCutin.portrait" class="ult-portrait" />
            <div class="ult-portrait-gloss"></div>
          </div>
          <!-- Decorative crosshairs -->
          <div class="ult-cross-tl"></div>
          <div class="ult-cross-tr"></div>
          <div class="ult-cross-bl"></div>
          <div class="ult-cross-br"></div>
        </div>
        <!-- 8. Skill title block (right side) -->
        <div class="ult-titlebar">
          <div class="ult-label">ULTIMATE SKILL</div>
          <div class="ult-name">{{ ultCutin.name }}</div>
          <div class="ult-skill-bar">
            <span class="ult-bracket-l">▶</span>
            <span class="ult-skill-name">{{ ultCutin.skill }}</span>
            <span class="ult-bracket-r">◀</span>
          </div>
          <div class="ult-tags">
            <span class="ult-tag ult-tag-rarity">{{ ultCutin.rarity }}</span>
            <span class="ult-tag ult-tag-role">{{ (ROLE_LABEL as any)[ultCutin.role] }}</span>
            <span class="ult-tag ult-tag-elem">{{ ultCutin.element.toUpperCase() }}</span>
          </div>
        </div>
        <!-- 9. Particles burst -->
        <div class="ult-particles">
          <span v-for="i in 14" :key="'p' + i" :class="`particle-${i}`"></span>
        </div>
      </div>
    </transition>

    <!-- Effect layer (projectiles, impacts) -->
    <div class="bt-fx-layer">
      <BattleEffect
        v-for="e in effects" :key="e.id"
        :kind="e.kind"
        :element="e.element as any"
        :from-x="e.fromX" :from-y="e.fromY"
        :to-x="e.toX" :to-y="e.toY"
        :duration="e.duration"
      />
    </div>

    <!-- HEADER -->
    <header class="bt-header">
      <button class="bt-back" @click="exit"><Icon name="arrow-back" :size="14" /></button>
      <div class="bt-info">
        <div class="bt-stage-id">
          CH.{{ stage.chapter }} · {{ stage.id }}
          <span class="bt-type-badge" :class="`bt-type-${battle.encounterType}`">
            {{ battle.encounterType === 'boss' ? 'BOSS' : battle.encounterType === 'elite' ? 'ELITE' : 'ENCOUNTER' }}
          </span>
        </div>
        <div class="bt-stage-name">{{ stage.name }}</div>
      </div>
      <!-- Battle speed mode toggle -->
      <div class="bt-speed-toggle" title="戦闘演出の速さ">
        <button class="speed-btn" :class="speedMode === 'quick' && 'speed-btn--active'" @click="setSpeedMode('quick')" title="高速モード">⚡</button>
        <button class="speed-btn" :class="speedMode === 'auto' && 'speed-btn--active'" @click="setSpeedMode('auto')" title="自動モード(雑魚速め/ボスはじっくり)">A</button>
        <button class="speed-btn" :class="speedMode === 'cinematic' && 'speed-btn--active'" @click="setSpeedMode('cinematic')" title="演出モード">🎬</button>
      </div>
      <div class="bt-progress">
        <div class="bt-progress-segs">
          <span v-for="i in progress.battlesToClear" :key="i"
            class="bt-progress-seg"
            :class="i <= progress.battlesCompleted ? 'done' : i === progress.battlesCompleted + 1 ? 'active' : ''"></span>
        </div>
        <div class="bt-turn">T<span>{{ battle.turn }}</span></div>
      </div>
    </header>

    <!-- BODY: main column + side log column -->
    <div class="bt-body">
      <div ref="battleRootEl" class="bt-main">

    <!-- ENEMY ARENA -->
    <section class="arena">
      <div class="arena-tag"><span class="dot dot-enemy"></span>ENEMY <span class="count">{{ aliveEnemies.length }}/{{ battle.enemies.length }}</span></div>
      <div class="unit-row">
        <button
          v-for="(e, idx) in battle.enemies" :key="idx"
          :ref="(el) => setUnitRef(e, el)"
          class="unit"
          :class="[
            e.hp === 0 && 'unit--fallen',
            selectedTarget === e && 'unit--target',
            e.broken && 'unit--broken',
            `unit-r-${e.rarity}`,
            activeAttacker === e && 'unit--acting',
            activeTargets.has(e) && 'unit--hit',
            activeAttacker && activeAttacker !== e && !activeTargets.has(e) && 'unit--dimmed'
          ]"
          @click="pickTarget(e)" :disabled="e.hp === 0 || battleOver || animating"
        >
          <div class="unit-img-wrap">
            <img :src="portraitOf(e)" />
            <div class="unit-img-grad"></div>
          </div>
          <div v-for="f in skillFlashes.filter(fl => fl.unit === e)" :key="f.id"
            class="unit-flash" :style="{ color: skillElementColor[f.element] || '#fff' }"></div>
          <span v-for="p in popups.filter(pp => pp.unit === e)" :key="p.id"
            class="dpop" :class="[`dpop-${p.kind}`, p.crit && 'dpop-crit']">
            <span v-if="p.attackerInitial" class="dpop-from">{{ p.attackerInitial }}</span>
            {{ p.value > 0 ? '+' : '' }}{{ Math.abs(p.value) }}<small v-if="p.crit">!!</small>
          </span>
          <!-- ULT gauge ring -->
          <div v-if="e.ultGauge > 0" class="ult-ring" :style="{ '--p': e.ultGauge + '%' } as any"></div>
          <!-- BREAK gauge -->
          <div v-if="e.breakGauge > 0 && !e.broken" class="break-bar">
            <div class="break-bar-fill" :style="{ width: e.breakGauge + '%' }"></div>
          </div>
          <div v-if="e.broken" class="broken-stamp">BREAK</div>
          <div class="unit-tag-l">
            <span class="rarity-badge" :class="`rb-${e.rarity}`">{{ e.rarity }}</span>
            <span class="elem-badge" :class="`elem-${e.element}`"><Icon :name="e.element" :size="10" /></span>
            <span class="role-badge">{{ ROLE_LABEL[e.role] }}</span>
          </div>
          <div class="unit-tag-r"><span class="lvl-pre">Lv</span><span class="lvl-num">{{ e.level }}</span></div>
          <div class="unit-bot">
            <div class="unit-name">{{ e.name }}</div>
            <div class="hpbar">
              <div class="hpbar-fill" :style="{ width: (getDisplayHp(e) / e.hpMax * 100) + '%' }"></div>
              <span class="hpbar-text">{{ getDisplayHp(e) }}/{{ e.hpMax }}</span>
            </div>
            <div v-if="e.statuses.length" class="status-row">
              <span v-for="s in e.statuses.slice(0, 4)" :key="s.status" class="status-chip">{{ statusName(s.status as string) }}</span>
            </div>
          </div>
          <!-- Weakness hint for selected skill -->
          <div v-if="selectedSkillId && e.hp > 0 && isWeaknessTo(SKILLS[selectedSkillId]?.element, e.element)" class="weak-hint">
            <Icon :name="SKILLS[selectedSkillId].element" :size="10" /> WEAK
          </div>
          <div v-if="selectedTarget === e && e.hp > 0" class="unit-target-arrow"><Icon name="play" :size="12" /></div>
        </button>
      </div>
    </section>


    <!-- ALLY ARENA -->
    <section class="arena">
      <div class="arena-tag"><span class="dot dot-ally"></span>PARTY <span class="count">{{ aliveAllies.length }}/{{ battle.allies.length }}</span></div>
      <div class="unit-row">
        <div
          v-for="(a, idx) in battle.allies" :key="idx"
          :ref="(el) => setUnitRef(a, el)"
          class="unit unit--ally"
          :class="[
            a.hp === 0 && 'unit--fallen',
            a === currentPlanner && 'unit--active',
            `unit-r-${a.rarity}`,
            activeAttacker === a && 'unit--acting',
            activeTargets.has(a) && 'unit--hit',
            activeAttacker && activeAttacker !== a && !activeTargets.has(a) && 'unit--dimmed',
            selectedTarget === a && 'unit--target-ally',
            canPickAlly(a) && 'unit--targetable',
          ]"
          @click="pickTarget(a)"
        >
          <div class="unit-img-wrap">
            <img :src="portraitOf(a, 'battle')" />
            <div class="unit-img-grad"></div>
          </div>
          <div v-for="f in skillFlashes.filter(fl => fl.unit === a)" :key="f.id"
            class="unit-flash" :style="{ color: skillElementColor[f.element] || '#fff' }"></div>
          <span v-for="p in popups.filter(pp => pp.unit === a)" :key="p.id"
            class="dpop" :class="[`dpop-${p.kind}`, p.crit && 'dpop-crit']">
            <span v-if="p.attackerInitial" class="dpop-from">{{ p.attackerInitial }}</span>
            {{ p.value > 0 ? '+' : '' }}{{ Math.abs(p.value) }}
          </span>
          <!-- ULT ready indicator -->
          <div v-if="a.ultGauge >= 100 && a.hp > 0" class="ult-ready">★ ULT</div>
          <div v-else-if="a.ultGauge > 0" class="ult-ring" :style="{ '--p': a.ultGauge + '%' } as any"></div>
          <div class="unit-tag-l">
            <span class="rarity-badge" :class="`rb-${a.rarity}`">{{ a.rarity }}</span>
            <span class="elem-badge" :class="`elem-${a.element}`"><Icon :name="a.element" :size="10" /></span>
            <span class="role-badge">{{ ROLE_LABEL[a.role] }}</span>
          </div>
          <div class="unit-tag-r"><span class="lvl-pre">Lv</span><span class="lvl-num">{{ a.level }}</span></div>
          <div class="unit-bot">
            <div class="unit-name">{{ a.name }}</div>
            <div class="hpbar">
              <div class="hpbar-fill" :style="{ width: (getDisplayHp(a) / a.hpMax * 100) + '%' }"></div>
              <span class="hpbar-text">{{ getDisplayHp(a) }}/{{ a.hpMax }}</span>
            </div>
            <div class="mpbar">
              <div class="mpbar-fill" :style="{ width: (getDisplayMp(a) / Math.max(1, a.mpMax) * 100) + '%' }"></div>
              <span class="mpbar-text">MP {{ getDisplayMp(a) }}</span>
            </div>
            <div v-if="a.statuses.length" class="status-row">
              <span v-for="s in a.statuses.slice(0, 4)" :key="s.status" class="status-chip">{{ statusName(s.status as string) }}</span>
            </div>
          </div>
          <div v-if="a === currentPlanner && a.hp > 0 && !battleOver" class="unit-active-arrow"><Icon name="play" :size="12" /></div>
        </div>
      </div>
    </section>

    <!-- ACTION PANEL -->
    <section v-if="!battleOver && currentPlanner" class="action-panel">
      <div class="action-title">
        <span class="action-eyebrow">PLANNING TURN {{ battle.turn }}</span>
        <span class="action-actor">{{ currentPlanner.name }}</span>
        <span class="action-progress">{{ activePlannerIdx + 1 }}/{{ aliveAllies.length }}</span>
      </div>

      <div class="skill-grid">
        <button v-for="s in usableSkills" :key="s.id"
          class="skill-tile"
          :class="[
            selectedSkillId === s.id && 'skill-tile--selected',
            !s.usable && 'skill-tile--disabled',
            s.ultimate && 'skill-tile--ult',
            `skill-tile--${s.element || 'neutral'}`
          ]"
          :disabled="!s.usable || animating"
          @click="pickSkill(s.id); hoveredSkillId = s.id"
          @mouseenter="hoveredSkillId = s.id"
          @mouseleave="hoveredSkillId = null"
        >
          <div class="skill-icon"><Icon :name="skillIconFor(s)" :size="16" /></div>
          <div class="skill-text">
            <div class="skill-name">{{ s.name }}</div>
            <div class="skill-desc">{{ s.description }}</div>
          </div>
          <div v-if="s.ultimate" class="skill-mp ult-tag">ULT</div>
          <div v-else-if="s.mpCost > 0" class="skill-mp"><span>{{ s.mpCost }}</span><small>MP</small></div>
        </button>
      </div>

      <!-- Skill detail panel — appears when hovering / selecting a skill -->
      <transition name="skillinfo">
        <div v-if="hoveredSkill || (selectedSkillId && SKILLS[selectedSkillId])"
             class="skill-info" :class="`skill-info--${(hoveredSkill || SKILLS[selectedSkillId!]).element}`">
          <div class="si-head">
            <span class="si-name">{{ (hoveredSkill || SKILLS[selectedSkillId!]).name }}</span>
            <span class="si-kind">{{ (hoveredSkill || SKILLS[selectedSkillId!]).kind }}</span>
            <span v-if="(hoveredSkill || SKILLS[selectedSkillId!]).mpCost > 0" class="si-mp">MP {{ (hoveredSkill || SKILLS[selectedSkillId!]).mpCost }}</span>
            <span v-if="(hoveredSkill || SKILLS[selectedSkillId!]).cooldown" class="si-cd">CD {{ (hoveredSkill || SKILLS[selectedSkillId!]).cooldown }}T</span>
            <span v-if="(hoveredSkill || SKILLS[selectedSkillId!]).ultimate" class="si-ult">★ULT</span>
          </div>
          <div class="si-desc">{{ (hoveredSkill || SKILLS[selectedSkillId!]).description }}</div>
          <div class="si-effects">
            <span v-for="(ef, idx) in (hoveredSkill || SKILLS[selectedSkillId!]).effects" :key="idx" class="si-effect-chip">
              <template v-if="ef.type === 'damage'">威力 {{ ef.power }}</template>
              <template v-else-if="ef.type === 'heal'">回復 {{ ef.power }}</template>
              <template v-else-if="ef.type === 'shield'">盾 {{ ef.shieldAmount }} ({{ ef.turns }}T)</template>
              <template v-else-if="ef.type === 'status'">{{ statusJp(ef.status!) }} {{ Math.round((ef.chance ?? 1) * 100) }}% ({{ ef.turns }}T)</template>
              <template v-else-if="ef.type === 'buff'">{{ ef.stat?.toUpperCase() }} {{ ef.pct! > 0 ? '+' : '' }}{{ ef.pct }}% ({{ ef.turns }}T)</template>
              <template v-else-if="ef.type === 'debuff'">{{ ef.stat?.toUpperCase() }} {{ ef.pct! > 0 ? '+' : '' }}{{ ef.pct }}% ({{ ef.turns }}T)</template>
              <template v-else-if="ef.type === 'cleanse'">デバフ解除</template>
              <template v-else-if="ef.type === 'revive'">蘇生 {{ ef.revivePct }}%</template>
              <template v-else-if="ef.type === 'taunt'">挑発 ({{ ef.turns }}T)</template>
              <template v-else-if="ef.type === 'ult_charge'">ULT +{{ ef.ultGain }}</template>
            </span>
          </div>
          <div class="si-target">対象: {{
            ({
              single_enemy: '敵単体',
              all_enemies: '敵全体',
              single_ally: '味方単体',
              lowest_hp_ally: '味方単体(HP低)',
              all_allies: '味方全体',
              self: '自身',
              single_dead_ally: '倒れた味方',
            } as any)[(hoveredSkill || SKILLS[selectedSkillId!]).target] || ''
          }}</div>
        </div>
      </transition>

      <div class="cmd-bar">
        <button class="cmd cmd--prev" :disabled="activePlannerIdx === 0 || animating" @click="goBackPlanner">
          <Icon name="arrow-back" :size="14" />
        </button>
        <button class="cmd cmd--attack" :disabled="animating || !selectedSkillId" @click="commitCurrentPlan">
          <Icon name="sword" :size="16" /><span>{{ isLastPlanner ? '実行' : '次へ' }}</span>
        </button>
        <button class="cmd cmd--alt" :disabled="animating" @click="setDefendPlan">
          <Icon name="shield" :size="14" /><span>防御</span>
        </button>
        <button class="cmd cmd--alt" :disabled="animating" @click="showCaptureMenu = !showCaptureMenu; showItemMenu = false">
          <Icon name="capture" :size="14" /><span>捕獲</span>
        </button>
        <button class="cmd cmd--alt" :disabled="animating" @click="showItemMenu = !showItemMenu; showCaptureMenu = false">
          <Icon name="flask" :size="14" /><span>道具</span>
        </button>
        <button class="cmd cmd--alt" :disabled="animating" @click="confirmFlee">
          <Icon name="flee" :size="14" /><span>逃走</span>
        </button>
      </div>

      <div v-if="showCaptureMenu" class="submenu">
        <div class="submenu-target">
          <Icon name="capture" :size="12" /><span>対象: <b>{{ selectedTarget?.name ?? "未選択" }}</b></span>
        </div>
        <div class="submenu-items">
          <button v-for="i in captureItems" :key="i.id" class="submenu-item" @click="confirmCapture(i.id)">
            <Icon name="scroll" :size="12" /><span>{{ i.name }}</span>
            <span class="submenu-count">×{{ player.items[i.id] }}</span>
            <span v-if="selectedTarget" class="submenu-prob">{{ captureChance(selectedTarget, i.captureMultiplier ?? 1) }}%</span>
          </button>
          <span v-if="captureItems.length === 0" class="text-xs text-white/40">契約書がない</span>
        </div>
      </div>
      <div v-if="showItemMenu" class="submenu">
        <div class="submenu-items">
          <button v-for="i in consumables" :key="i.id" class="submenu-item" @click="confirmItem(i.id)">
            <Icon name="flask" :size="12" /><span>{{ i.name }}</span>
            <span class="submenu-count">×{{ player.items[i.id] }}</span>
          </button>
          <span v-if="consumables.length === 0" class="text-xs text-white/40">道具がない</span>
        </div>
      </div>
    </section>
      </div><!-- /.bt-main -->

      <!-- ============== RIGHT-SIDE BATTLE LOG ============== -->
      <aside class="bt-side-log-wrap">
        <div class="bt-side-log-head">
          <span class="dot dot-ally"></span><span>BATTLE LOG</span>
          <span class="bt-side-turn">T<b>{{ battle.turn }}</b></span>
        </div>
        <div ref="sideLogRef" class="bt-side-log">
          <div v-for="(l, i) in enrichedLog" :key="i"
            class="logrow" :class="[`log-side-${l.side}`, `log-${l.kind || 'info'}`]">
            <div v-if="l.actor" class="logrow-avatar">
              <img :src="portraitOf(l.actor, 'portrait')" />
            </div>
            <div v-else class="logrow-spacer"></div>
            <div class="logrow-body">
              <div v-if="l.actor" class="logrow-name">
                {{ l.actor.name }}
                <span class="logrow-side-tag">{{ l.side === 'ally' ? '味方' : '敵' }}</span>
              </div>
              <div class="logrow-text">{{ l.text }}</div>
            </div>
          </div>
        </div>
      </aside>
    </div><!-- /.bt-body -->

    <!-- RESULT -->
    <div v-if="battleOver" class="result-overlay">
      <div class="result-card">
        <div class="result-banner" :class="battle.phase === 'end_victory' ? 'result-win' : 'result-lose'">
          <Icon :name="battle.phase === 'end_victory' ? 'crown' : 'lock'" :size="26" />
          <span>{{ battle.phase === 'end_victory' ? 'VICTORY' : 'DEFEAT' }}</span>
        </div>
        <div v-if="rewardSummary && battle.phase === 'end_victory'" class="result-body">
          <div class="reward-row">
            <div class="reward reward-gold"><Icon name="gold" :size="22" /><div><div class="reward-label">GOLD</div><div class="reward-val">+{{ rewardSummary.gold }}</div></div></div>
            <div class="reward reward-exp"><Icon name="star" :size="22" /><div><div class="reward-label">EXP</div><div class="reward-val">+{{ rewardSummary.exp }}</div></div></div>
          </div>
          <div v-if="rewardSummary.captured" class="captured">
            <Icon name="sparkle" :size="20" />
            <div>
              <div class="cap-label">NEW MEMBER</div>
              <div class="cap-name">{{ CHARACTERS_BY_ID[rewardSummary.captured.charId].name }} を仲間にした</div>
              <RarityStars :rarity="CHARACTERS_BY_ID[rewardSummary.captured.charId].rarity" :size="11" />
            </div>
          </div>
          <div v-if="rewardSummary.events?.length" class="event-list">
            <div v-for="(ev, i) in rewardSummary.events" :key="i" class="event-row">
              <div class="event-name">{{ ev.name }}</div>
              <div v-for="(e, j) in ev.events" :key="j" class="event-line">
                <span v-if="e.type === 'levelup'" class="ev-up">↑ Lv {{ e.level }}</span>
                <span v-if="e.type === 'evolve'" class="ev-evo">★ 第{{ e.newStage }}形態に進化</span>
                <span v-if="e.type === 'skill_learned'" class="ev-skill">✦ 『{{ SKILLS[e.skillId]?.name }}』習得</span>
              </div>
            </div>
          </div>
        </div>
        <div class="result-actions">
          <template v-if="battle.phase === 'end_victory' && !stageDoneAfter()">
            <button class="cmd cmd--attack" @click="nextBattle"><Icon name="arrow-right" :size="14" /><span>次のバトル</span></button>
            <button class="cmd cmd--alt" @click="exit"><Icon name="home" :size="12" /><span>退却</span></button>
          </template>
          <template v-else>
            <button class="cmd cmd--attack" @click="exit"><Icon name="home" :size="14" /><span>{{ battle.phase === 'end_defeat' ? 'ホームへ' : 'ステージへ' }}</span></button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bt-root { position: absolute; inset: 0; overflow: hidden; color: white; display: flex; flex-direction: column; }
.bt-flash { position: absolute; inset: 0; z-index: 40; pointer-events: none; mix-blend-mode: screen; animation: bt-flash 0.3s ease-out; }
@keyframes bt-flash { 0% { opacity: 0; } 50% { opacity: 0.7; } 100% { opacity: 0; } }

/* Attack banner: attacker → skill → target */
.bt-banner {
  position: absolute; top: 38%; left: 50%; transform: translate(-50%, -50%);
  z-index: 35; pointer-events: none;
  padding: 8px 22px;
  background: linear-gradient(90deg, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.85) 20%, rgba(0,0,0,0.85) 80%, rgba(0,0,0,0.0) 100%);
  border-top: 1px solid var(--banner-c, #ff6b9d);
  border-bottom: 1px solid var(--banner-c, #ff6b9d);
  filter: drop-shadow(0 0 18px var(--banner-c, #ff6b9d));
}
.bt-banner-row {
  display: flex; align-items: center; gap: 12px;
  font-family: 'M PLUS Rounded 1c', sans-serif;
  white-space: nowrap;
}
.bt-banner-attacker, .bt-banner-target {
  font-weight: 900; font-size: 1.05rem;
  color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.7), 0 0 12px var(--banner-c, #ff6b9d);
}
.bt-banner-skill {
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 900;
  font-size: 1.6rem;
  background: linear-gradient(180deg, #ffffff 40%, var(--banner-c, #ff6b9d));
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.03em;
}
.bt-banner-arrow {
  color: var(--banner-c, #ff6b9d);
  font-size: 14px;
  font-weight: 900;
  filter: drop-shadow(0 0 6px currentColor);
}
.bt-banner-fire { --banner-c: #ff8c42; }
.bt-banner-water { --banner-c: #60a5fa; }
.bt-banner-wood { --banner-c: #4ade80; }
.bt-banner-light { --banner-c: #fde047; }
.bt-banner-dark { --banner-c: #c084fc; }
.bt-banner-ult { --banner-c: #fde047; box-shadow: 0 0 28px rgba(253, 224, 71, 0.4) inset; }
.banner-enter-active, .banner-leave-active { transition: all 0.3s cubic-bezier(.2,.9,.3,1.4); }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }

/* =====================================================================
   ULT FULLSCREEN CUT-IN — 1.9s total
   Phases (timing in ms):
     0-150    : blackout + initial dark wash
     150-450  : letterbox bars slide in + speed stripes rush
     400-900  : portrait flies in from left + aura erupts
     600-1200 : skill name pops + tags appear
     1300-1900: hold + glow pulse, then fade out
   ===================================================================== */
.ult-overlay {
  position: absolute; inset: 0; z-index: 80;
  pointer-events: none;
  overflow: hidden;
  --ult-c: #fde047;
  --ult-c2: #ff6b9d;
  color: var(--ult-c);
}
.ult-elem-fire   { --ult-c: #ff8c42; --ult-c2: #fde047; }
.ult-elem-water  { --ult-c: #60a5fa; --ult-c2: #c2eaff; }
.ult-elem-wood   { --ult-c: #4ade80; --ult-c2: #fde047; }
.ult-elem-light  { --ult-c: #fde047; --ult-c2: #ffffff; }
.ult-elem-dark   { --ult-c: #c084fc; --ult-c2: #f0abfc; }

/* === Blackout + radial pulse === */
.ult-blackout {
  position: absolute; inset: 0;
  background: radial-gradient(circle at center, rgba(20, 5, 30, 0.7) 0%, rgba(0, 0, 0, 0.96) 70%);
  animation: ult-blackout 1.9s ease-out forwards;
}
@keyframes ult-blackout {
  0% { opacity: 0; }
  8% { opacity: 1; }
  88% { opacity: 1; }
  100% { opacity: 0; }
}
.ult-radial {
  position: absolute; inset: -10%;
  background: radial-gradient(circle at 50% 50%, var(--ult-c) 0%, transparent 30%);
  mix-blend-mode: screen;
  opacity: 0;
  animation: ult-radial 1.9s ease-out forwards;
}
@keyframes ult-radial {
  0%, 5% { opacity: 0; transform: scale(0.2); }
  20% { opacity: 0.6; transform: scale(1); }
  40% { opacity: 0.3; transform: scale(1.4); }
  90% { opacity: 0.2; transform: scale(1.8); }
  100% { opacity: 0; transform: scale(2); }
}

/* === Halftone pattern === */
.ult-halftone {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 1.2px, transparent 1.5px);
  background-size: 14px 14px;
  mix-blend-mode: overlay;
  opacity: 0;
  animation: ult-halftone 1.9s ease-out forwards;
}
@keyframes ult-halftone {
  0% { opacity: 0; transform: scale(1); }
  15% { opacity: 0.8; transform: scale(1); }
  85% { opacity: 0.6; transform: scale(1.15); }
  100% { opacity: 0; transform: scale(1.2); }
}

/* === Diagonal speed stripes === */
.ult-stripes { position: absolute; inset: 0; }
.ult-stripes span {
  position: absolute;
  left: -120%; width: 120%;
  height: 20px;
  transform: skewY(-12deg);
  background: linear-gradient(90deg, transparent 0%, transparent 30%, var(--ult-c2) 50%, var(--ult-c) 70%, transparent 100%);
  filter: blur(1.5px) drop-shadow(0 0 14px var(--ult-c));
  opacity: 0;
  animation: ult-stripe 1.9s cubic-bezier(.2, .65, .35, 1) forwards;
}
.stripe-1 { top: 8%;  animation-delay: 0.05s; }
.stripe-2 { top: 21%; animation-delay: 0.12s; height: 8px; }
.stripe-3 { top: 36%; animation-delay: 0.0s;  height: 30px; }
.stripe-4 { top: 50%; animation-delay: 0.18s; height: 12px; }
.stripe-5 { top: 64%; animation-delay: 0.08s; height: 22px; }
.stripe-6 { top: 78%; animation-delay: 0.15s; height: 10px; }
.stripe-7 { top: 90%; animation-delay: 0.22s; height: 16px; }
@keyframes ult-stripe {
  0%   { left: -120%; opacity: 0; }
  6%   { opacity: 0.95; }
  35%  { left: 100%; opacity: 0.85; }
  55%  { opacity: 0; left: 100%; }
  100% { opacity: 0; left: 100%; }
}

/* === Concentric expanding rings === */
.ult-rings {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  width: 0; height: 0;
}
.ult-rings span {
  position: absolute; left: 0; top: 0;
  width: 100px; height: 100px;
  margin-left: -50px; margin-top: -50px;
  border: 4px solid var(--ult-c);
  border-radius: 50%;
  opacity: 0;
  filter: drop-shadow(0 0 18px var(--ult-c));
  animation: ult-ring 1.9s ease-out forwards;
}
.ult-rings span:nth-child(1) { animation-delay: 0.1s; }
.ult-rings span:nth-child(2) { animation-delay: 0.25s; border-color: var(--ult-c2); }
.ult-rings span:nth-child(3) { animation-delay: 0.4s; }
@keyframes ult-ring {
  0% { transform: scale(0); opacity: 1; border-width: 4px; }
  60% { transform: scale(12); opacity: 0.5; border-width: 1px; }
  100% { transform: scale(16); opacity: 0; border-width: 0px; }
}

/* === Cinematic letterbox bars === */
.ult-bar {
  position: absolute; left: 0; right: 0;
  height: 70px;
  background: linear-gradient(to bottom, #000 60%, rgba(0,0,0,0.85));
  border-color: var(--ult-c);
  animation: ult-bar 1.9s cubic-bezier(.3,.7,.35,1) forwards;
}
.ult-bar-top    { top: 0;    transform: translateY(-100%); border-bottom: 2px solid var(--ult-c); box-shadow: 0 4px 18px var(--ult-c); }
.ult-bar-bottom { bottom: 0; transform: translateY(100%);  border-top: 2px solid var(--ult-c); box-shadow: 0 -4px 18px var(--ult-c); background: linear-gradient(to top, #000 60%, rgba(0,0,0,0.85)); }
@keyframes ult-bar {
  0% { transform: translateY(var(--from, -100%)); }
  18% { transform: translateY(0); }
  82% { transform: translateY(0); }
  100% { transform: translateY(var(--to, -100%)); }
}
.ult-bar-top    { --from: -100%; --to: -100%; }
.ult-bar-bottom { --from: 100%;  --to: 100%; }

/* === Lightning bolts === */
.ult-lightning {
  position: absolute; inset: 0;
  pointer-events: none;
  color: var(--ult-c);
  filter: drop-shadow(0 0 6px var(--ult-c)) drop-shadow(0 0 14px var(--ult-c));
  opacity: 0;
  animation: ult-lightning 1.9s ease-out forwards;
}
@keyframes ult-lightning {
  0%, 15% { opacity: 0; }
  20% { opacity: 1; }
  25% { opacity: 0.2; }
  30% { opacity: 1; }
  40% { opacity: 0.6; }
  85% { opacity: 0.3; }
  100% { opacity: 0; }
}

/* === Portrait with frame === */
.ult-portrait-wrap {
  position: absolute;
  top: 50%; left: 22%;
  transform: translate(-50%, -50%);
  width: 340px; height: 440px;
  opacity: 0;
  animation: ult-portrait-pop 1.9s cubic-bezier(.2,.9,.3,1.4) forwards;
}
@keyframes ult-portrait-pop {
  0% { opacity: 0; transform: translate(-150%, -50%) rotate(-8deg); }
  18% { opacity: 1; transform: translate(-50%, -50%) rotate(0deg) scale(1.06); }
  78% { opacity: 1; transform: translate(-50%, -50%) rotate(0deg) scale(1); }
  100% { opacity: 0; transform: translate(-30%, -50%) rotate(0deg) scale(1.1); }
}

.ult-portrait-aura {
  position: absolute; inset: -40px;
  background:
    radial-gradient(ellipse at center, var(--ult-c) 0%, transparent 55%),
    radial-gradient(ellipse at center, var(--ult-c2) 0%, transparent 75%);
  filter: blur(28px);
  mix-blend-mode: screen;
  opacity: 0.7;
  animation: ult-aura 1.9s ease-in-out forwards;
}
@keyframes ult-aura {
  0% { opacity: 0; transform: scale(0.5); }
  20% { opacity: 1; transform: scale(1); }
  60% { opacity: 0.85; transform: scale(1.12); }
  100% { opacity: 0; transform: scale(1.3); }
}

.ult-portrait-frame {
  position: absolute; inset: 0;
  border: 3px solid var(--ult-c);
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0,0,0,0.4);
  box-shadow:
    0 0 40px var(--ult-c),
    0 0 80px var(--ult-c),
    0 8px 30px rgba(0,0,0,0.7),
    inset 0 0 30px rgba(255,255,255,0.08);
  clip-path: polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px);
}
.ult-portrait {
  width: 100%; height: 100%;
  object-fit: cover;
  filter: contrast(1.15) saturate(1.2);
}
.ult-portrait-gloss {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.25) 30%, transparent 50%);
  mix-blend-mode: overlay;
  animation: ult-gloss 1.9s ease-out forwards;
}
@keyframes ult-gloss {
  0% { transform: translateX(-100%); opacity: 0; }
  30% { transform: translateX(-50%); opacity: 1; }
  60% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(100%); opacity: 0; }
}

/* Crosshair corner decorations */
.ult-cross-tl, .ult-cross-tr, .ult-cross-bl, .ult-cross-br {
  position: absolute;
  width: 30px; height: 30px;
  border-color: var(--ult-c);
  filter: drop-shadow(0 0 6px var(--ult-c));
  opacity: 0;
  animation: ult-cross 1.9s ease-out forwards;
}
@keyframes ult-cross {
  0%, 15% { opacity: 0; transform: scale(1.5); }
  25% { opacity: 1; transform: scale(1); }
  80% { opacity: 1; }
  100% { opacity: 0; transform: scale(0.8); }
}
.ult-cross-tl { top: -16px;    left: -16px;    border-top: 3px solid; border-left: 3px solid; }
.ult-cross-tr { top: -16px;    right: -16px;   border-top: 3px solid; border-right: 3px solid; }
.ult-cross-bl { bottom: -16px; left: -16px;    border-bottom: 3px solid; border-left: 3px solid; }
.ult-cross-br { bottom: -16px; right: -16px;   border-bottom: 3px solid; border-right: 3px solid; }

/* === Title block (right side) === */
.ult-titlebar {
  position: absolute;
  top: 50%; right: 6%;
  transform: translateY(-50%);
  max-width: 60%;
  text-align: right;
  opacity: 0;
  animation: ult-title-pop 1.9s cubic-bezier(.2,.9,.3,1.4) forwards;
}
@keyframes ult-title-pop {
  0%, 22% { opacity: 0; transform: translate(60px, -50%); }
  32% { opacity: 1; transform: translate(-12px, -50%); }
  45% { opacity: 1; transform: translate(0, -50%); }
  80% { opacity: 1; transform: translate(0, -50%); }
  100% { opacity: 0; transform: translate(40px, -50%); }
}

.ult-label {
  font-family: 'Orbitron', monospace;
  font-size: 18px; font-weight: 900;
  letter-spacing: 0.5em;
  color: var(--ult-c);
  text-shadow: 0 0 18px var(--ult-c), 0 0 36px var(--ult-c);
  margin-bottom: 6px;
}
.ult-name {
  font-family: 'M PLUS Rounded 1c', sans-serif;
  font-size: 1.6rem; font-weight: 900;
  color: white;
  text-shadow: 0 2px 8px rgba(0,0,0,0.8), 0 0 18px var(--ult-c2);
  margin-bottom: 12px;
}
.ult-skill-bar {
  display: flex; align-items: center; justify-content: flex-end; gap: 14px;
  margin-bottom: 14px;
}
.ult-skill-name {
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 900;
  font-size: 4.5rem;
  line-height: 1.0;
  background: linear-gradient(180deg, #ffffff 20%, var(--ult-c2) 50%, var(--ult-c) 80%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  filter:
    drop-shadow(0 4px 20px var(--ult-c))
    drop-shadow(0 0 40px var(--ult-c));
  letter-spacing: 0.04em;
  animation: ult-skill-pulse 1.9s ease-in-out forwards;
}
@keyframes ult-skill-pulse {
  0% { transform: scale(1); }
  35% { transform: scale(1.04); }
  70% { transform: scale(1); }
  100% { transform: scale(1.02); }
}
.ult-bracket-l, .ult-bracket-r {
  color: var(--ult-c);
  font-size: 2.2rem;
  filter: drop-shadow(0 0 12px var(--ult-c));
  animation: ult-bracket 1.9s ease-out forwards;
}
@keyframes ult-bracket {
  0%, 25% { opacity: 0; transform: scale(0); }
  35% { opacity: 1; transform: scale(1.3); }
  50% { transform: scale(1); }
  80% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.9); }
}
.ult-tags {
  display: flex; gap: 8px; justify-content: flex-end;
}
.ult-tag {
  font-family: 'Orbitron', monospace;
  font-size: 11px; font-weight: 900;
  padding: 3px 10px;
  border-radius: 3px;
  letter-spacing: 0.18em;
  background: rgba(0,0,0,0.55);
  border: 1px solid var(--ult-c);
  color: var(--ult-c);
  text-shadow: 0 0 8px var(--ult-c);
}
.ult-tag-elem { background: var(--ult-c); color: black; text-shadow: none; }

/* === Particle burst === */
.ult-particles {
  position: absolute; left: 50%; top: 50%;
  width: 0; height: 0;
}
.ult-particles span {
  position: absolute; left: 0; top: 0;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle, white 30%, var(--ult-c) 60%, transparent 80%);
  filter: drop-shadow(0 0 8px var(--ult-c));
  opacity: 0;
  animation: ult-particle 1.9s cubic-bezier(.2,.7,.4,1) forwards;
}
.particle-1  { --ang:   0deg; }
.particle-2  { --ang:  26deg; }
.particle-3  { --ang:  52deg; }
.particle-4  { --ang:  78deg; }
.particle-5  { --ang: 104deg; }
.particle-6  { --ang: 130deg; }
.particle-7  { --ang: 156deg; }
.particle-8  { --ang: 182deg; }
.particle-9  { --ang: 208deg; }
.particle-10 { --ang: 234deg; }
.particle-11 { --ang: 260deg; }
.particle-12 { --ang: 286deg; }
.particle-13 { --ang: 312deg; }
.particle-14 { --ang: 338deg; }
@keyframes ult-particle {
  0%, 10% { opacity: 0; transform: rotate(var(--ang)) translateX(0); }
  20% { opacity: 1; transform: rotate(var(--ang)) translateX(60px); }
  85% { opacity: 0.5; transform: rotate(var(--ang)) translateX(450px); }
  100% { opacity: 0; transform: rotate(var(--ang)) translateX(550px); }
}

/* Transition wrapper */
.cutin-enter-active { transition: opacity 0.2s ease; }
.cutin-enter-from { opacity: 0; }
.cutin-leave-active { transition: opacity 0.3s ease; }
.cutin-leave-to { opacity: 0; }

/* Effect overlay layer */
.bt-fx-layer {
  position: absolute; inset: 0;
  pointer-events: none;
  z-index: 25;
}

/* HEADER */
.bt-header {
  display: flex; align-items: center; gap: 0.65rem;
  padding: 0.5rem 0.8rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.92), rgba(15, 8, 30, 0.5));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 107, 157, 0.15);
  flex-shrink: 0;
}
.bt-back {
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 5px; color: white;
}
.bt-info { flex: 1; min-width: 0; }
.bt-stage-id { font-family: 'Orbitron', monospace; font-size: 9px; letter-spacing: 0.25em; color: rgba(255, 200, 230, 0.7); display: flex; align-items: center; gap: 6px; }
.bt-stage-name { font-weight: 800; font-size: 0.92rem; }
.bt-type-badge {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 0.15em;
  color: white;
}
.bt-type-trash { background: linear-gradient(135deg, #64748b, #475569); }
.bt-type-elite { background: linear-gradient(135deg, #c084fc, #7c3aed); box-shadow: 0 0 8px rgba(192, 132, 252, 0.6); }
.bt-type-boss {
  background: linear-gradient(135deg, #ef4444, #be123c);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
  animation: boss-pulse 1.5s ease-in-out infinite;
}
@keyframes boss-pulse {
  0%, 100% { box-shadow: 0 0 8px rgba(239, 68, 68, 0.6); }
  50% { box-shadow: 0 0 14px rgba(239, 68, 68, 1); }
}

/* Battle speed toggle */
.bt-speed-toggle {
  display: flex; gap: 2px;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 5px;
  padding: 2px;
}
.speed-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.6);
  border-radius: 3px;
  cursor: pointer;
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  transition: all 0.2s ease;
}
.speed-btn:hover { background: rgba(255,255,255,0.08); color: white; }
.speed-btn--active {
  background: linear-gradient(135deg, #ff6b9d, #c34dff);
  color: white;
  box-shadow: 0 0 10px rgba(255, 107, 157, 0.5);
}

.bt-turnorder {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 2px 6px;
  background: rgba(0,0,0,0.3);
  border-radius: 4px;
}
.to-eye { font-family: 'Orbitron', monospace; font-size: 8px; letter-spacing: 0.2em; color: rgba(255,255,255,0.5); }
.to-list { display: flex; gap: 3px; }
.to-item {
  width: 26px; height: 26px;
  border-radius: 4px;
  overflow: hidden;
  border: 1.5px solid rgba(255,255,255,0.2);
}
.to-item img { width: 100%; height: 100%; object-fit: cover; }
.to-ally { border-color: #60a5fa; }
.to-enemy { border-color: #f87171; }

.bt-progress { text-align: right; flex-shrink: 0; }
.bt-progress-segs { display: flex; gap: 2px; justify-content: flex-end; margin-bottom: 3px; }
.bt-progress-seg { width: 18px; height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; }
.bt-progress-seg.done { background: linear-gradient(90deg, #fbbf24, #f59e0b); box-shadow: 0 0 6px rgba(251,191,36,0.6); }
.bt-progress-seg.active { background: linear-gradient(90deg, #ff6b9d, #c34dff); animation: pulse-seg 1.2s ease-in-out infinite; }
@keyframes pulse-seg { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
.bt-turn { font-family: 'Orbitron', monospace; font-size: 9px; letter-spacing: 0.2em; color: rgba(255,255,255,0.5); }
.bt-turn span { color: white; font-weight: 800; font-size: 12px; }

/* BODY layout: main column + right log */
.bt-body {
  flex: 1; min-height: 0;
  display: flex;
  gap: 0;
}
.bt-main {
  flex: 1; min-width: 0; min-height: 0;
  display: flex; flex-direction: column;
  position: relative;
}

/* Right-side vertical log */
.bt-side-log-wrap {
  width: 240px;
  flex-shrink: 0;
  display: flex; flex-direction: column;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.92), rgba(10, 5, 20, 0.95));
  border-left: 1px solid rgba(255, 200, 230, 0.15);
  backdrop-filter: blur(12px);
}
.bt-side-log-head {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px;
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.25em;
  color: rgba(255, 200, 230, 0.7);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.bt-side-log-head .dot { background: linear-gradient(135deg, #ff6b9d, #c34dff); box-shadow: 0 0 6px rgba(255,107,157,0.8); }
.bt-side-turn { margin-left: auto; }
.bt-side-turn b { color: white; font-size: 14px; }

.bt-side-log {
  flex: 1; min-height: 0;
  overflow-y: auto;
  padding: 6px;
  display: flex; flex-direction: column-reverse;  /* newest at bottom, visually shows recent */
}
.bt-side-log::-webkit-scrollbar { width: 4px; }
.bt-side-log::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }

.logrow {
  display: flex; gap: 6px; align-items: flex-start;
  padding: 5px 6px;
  margin-bottom: 3px;
  border-radius: 4px;
  border-left: 3px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.02);
  font-size: 11px;
  line-height: 1.35;
  animation: logrow-in 0.4s cubic-bezier(.2,.9,.3,1.2) backwards;
}
@keyframes logrow-in {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
.log-side-ally {
  background: linear-gradient(90deg, rgba(96,165,250,0.18), rgba(96,165,250,0.04));
  border-left-color: #60a5fa;
}
.log-side-enemy {
  background: linear-gradient(90deg, rgba(248,113,113,0.18), rgba(248,113,113,0.04));
  border-left-color: #f87171;
}
.log-side-neutral {
  border-left-color: rgba(255,255,255,0.2);
}
.logrow-avatar {
  width: 32px; height: 32px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.2);
}
.log-side-ally .logrow-avatar { border-color: #60a5fa; }
.log-side-enemy .logrow-avatar { border-color: #f87171; }
.logrow-avatar img {
  width: 100%; height: 100%;
  object-fit: cover; object-position: 50% 5%;
}
.logrow-spacer { width: 32px; flex-shrink: 0; }
.logrow-body { flex: 1; min-width: 0; }
.logrow-name {
  font-size: 10.5px;
  font-weight: 800;
  display: flex; align-items: center; gap: 4px;
}
.log-side-ally .logrow-name { color: #93c5fd; }
.log-side-enemy .logrow-name { color: #fca5a5; }
.logrow-side-tag {
  font-family: 'Orbitron', monospace;
  font-size: 7px;
  padding: 1px 4px;
  background: rgba(0,0,0,0.4);
  border-radius: 2px;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.6);
}
.logrow-text {
  color: rgba(255,255,255,0.85);
  font-size: 10.5px;
  white-space: normal;
  word-break: break-word;
}
.logrow.log-damage .logrow-text { color: #fca5a5; }
.logrow.log-heal .logrow-text { color: #6ee7b7; }
.logrow.log-skill .logrow-text { color: #f9a8d4; font-weight: 700; }
.logrow.log-ult .logrow-text { color: #fde047; font-weight: 800; }
.logrow.log-break .logrow-text { color: #fde047; }
.logrow.log-status .logrow-text, .logrow.log-capture .logrow-text { color: #fde68a; }
.logrow.log-victory .logrow-text { color: #6ee7b7; font-weight: 800; }
.logrow.log-defeat .logrow-text { color: #fb7185; font-weight: 800; }

/* ARENAS */
.arena { padding: 0.3rem 0.85rem; flex-shrink: 0; min-height: 0; flex: 1; display: flex; flex-direction: column; }
.arena-tag { display: flex; align-items: center; gap: 0.4rem; font-family: 'Orbitron', monospace; font-size: 9px; letter-spacing: 0.3em; color: rgba(255, 200, 230, 0.65); margin-bottom: 0.25rem; flex-shrink: 0; }
.dot { width: 6px; height: 6px; border-radius: 50%; }
.dot-enemy { background: #f87171; box-shadow: 0 0 8px #f87171; }
.dot-ally { background: #60a5fa; box-shadow: 0 0 8px #60a5fa; }
.count { margin-left: auto; color: rgba(255,255,255,0.5); }
.unit-row { display: flex; gap: 0.4rem; justify-content: center; flex-wrap: wrap; flex: 1; min-height: 0; }

/* UNIT */
.unit {
  position: relative; flex: 0 1 130px; max-height: 100%;
  display: flex; flex-direction: column;
  background: linear-gradient(180deg, rgba(31, 21, 56, 0.95), rgba(15, 8, 30, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px; overflow: hidden; padding: 0; cursor: pointer;
  transition: all 0.25s cubic-bezier(.2,.9,.3,1.4);
  clip-path: polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px));
  /* Reserve solid bottom for HP/MP so face is never covered by text */
  --unit-bot-h: 38px;
}
.unit--ally { flex: 0 1 140px; --unit-bot-h: 50px; }
.unit:hover:not(:disabled):not(.unit--fallen) { transform: translateY(-3px) scale(1.02); }
.unit--target {
  border-color: #f87171 !important;
  box-shadow: 0 0 0 2px rgba(248, 113, 113, 0.7), 0 0 20px rgba(248, 113, 113, 0.5);
  animation: tgtpulse 1s ease-in-out infinite;
}
@keyframes tgtpulse { 0%,100% { box-shadow: 0 0 0 2px rgba(248,113,113,0.7), 0 0 20px rgba(248,113,113,0.45); } 50% { box-shadow: 0 0 0 2.5px rgba(248,113,113,1), 0 0 30px rgba(248,113,113,0.75); } }
.unit--active {
  border-color: #60a5fa !important;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.7), 0 0 20px rgba(96, 165, 250, 0.5);
  animation: actpulse 1.2s ease-in-out infinite;
}
@keyframes actpulse { 0%,100% { box-shadow: 0 0 0 2px rgba(96,165,250,0.7), 0 0 18px rgba(96,165,250,0.45); } 50% { box-shadow: 0 0 0 2.5px rgba(96,165,250,1), 0 0 28px rgba(96,165,250,0.7); } }
.unit--fallen { filter: grayscale(0.8) brightness(0.55); transform: rotate(-2deg); opacity: 0.65; }
.unit--broken {
  border-color: #fde047 !important;
  box-shadow: 0 0 0 2px rgba(253, 224, 71, 0.7), 0 0 22px rgba(253, 224, 71, 0.5);
}
.unit--targetable {
  cursor: pointer;
  animation: targetable-pulse 1.4s ease-in-out infinite;
}
@keyframes targetable-pulse {
  0%, 100% { box-shadow: 0 0 0 1.5px rgba(110, 231, 183, 0.5), 0 0 10px rgba(110, 231, 183, 0.4); }
  50% { box-shadow: 0 0 0 2px rgba(110, 231, 183, 0.9), 0 0 18px rgba(110, 231, 183, 0.7); }
}
.unit--target-ally {
  border-color: #34d399 !important;
  box-shadow: 0 0 0 2.5px rgba(52, 211, 153, 0.9), 0 0 22px rgba(52, 211, 153, 0.6) !important;
}

/* === Battle clarity: highlight the acting unit + targets, dim others === */
.unit--acting {
  transform: translateY(-6px) scale(1.08);
  z-index: 12;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.95), 0 0 36px rgba(96, 165, 250, 0.8), 0 12px 24px rgba(0,0,0,0.6) !important;
  filter: brightness(1.15) saturate(1.2);
}
.unit--hit {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 0 0 2.5px rgba(248, 113, 113, 0.9), 0 0 24px rgba(248, 113, 113, 0.65) !important;
  z-index: 11;
  animation: hit-shake 0.18s ease-out 0.25s 2;
}
@keyframes hit-shake {
  0%, 100% { transform: translateY(-2px) scale(1.03) translateX(0); }
  50% { transform: translateY(-2px) scale(1.03) translateX(-4px); }
}
.unit--dimmed {
  filter: brightness(0.45) saturate(0.5) blur(0.5px);
  opacity: 0.65;
  transition: filter 0.2s ease, opacity 0.2s ease;
}

.unit-r-N { border-color: rgba(148,163,184,0.4); }
.unit-r-R { border-color: rgba(96,165,250,0.6); box-shadow: 0 0 10px rgba(96,165,250,0.25); }
.unit-r-SR { border-color: rgba(192,132,252,0.7); box-shadow: 0 0 14px rgba(192,132,252,0.35); }
.unit-r-SSR { border-color: rgba(251,191,36,0.8); box-shadow: 0 0 18px rgba(251,191,36,0.4); }
.unit-r-UR { border-color: rgba(248,113,113,0.85); box-shadow: 0 0 22px rgba(248,113,113,0.5); }

.unit-img-wrap { position: relative; width: 100%; flex: 1; min-height: 0; overflow: hidden; }
.unit-img-wrap img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 5%; filter: contrast(1.08) saturate(1.15); }
.unit-img-grad { position: absolute; inset: auto 0 0 0; height: 22%; background: linear-gradient(to top, rgba(14,8,28,0.9), transparent); pointer-events: none; }

.unit-tag-l {
  position: absolute; top: 4px; left: 4px;
  display: flex; flex-direction: column; gap: 2px; z-index: 5; align-items: flex-start;
  /* Smaller corner badges minimise face overlap */
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6));
}
.rarity-badge { font-family: 'Orbitron', monospace; font-size: 8px; font-weight: 900; padding: 1px 4px; border-radius: 2px; letter-spacing: 0.05em; color: white; }
.rb-N { background: linear-gradient(135deg, #94a3b8, #475569); }
.rb-R { background: linear-gradient(135deg, #60a5fa, #1d4ed8); }
.rb-SR { background: linear-gradient(135deg, #c084fc, #7c3aed); }
.rb-SSR { background: linear-gradient(135deg, #fbbf24, #d97706); }
.rb-UR { background: linear-gradient(135deg, #f87171, #be123c); }
.elem-badge {
  width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
}
.elem-fire { background: linear-gradient(135deg, #ff8c42, #c2410c); }
.elem-water { background: linear-gradient(135deg, #38bdf8, #1d4ed8); }
.elem-wood { background: linear-gradient(135deg, #4ade80, #15803d); }
.elem-light { background: linear-gradient(135deg, #fde68a, #d97706); }
.elem-dark { background: linear-gradient(135deg, #c084fc, #4c1d95); }
.role-badge {
  font-family: 'M PLUS Rounded 1c', sans-serif;
  font-size: 8px; font-weight: 800;
  padding: 1px 4px;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(2px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 2px;
  color: #f9a8d4;
}

.unit-tag-r { position: absolute; top: 4px; right: 4px; display: flex; align-items: baseline; gap: 1px; padding: 1px 5px; background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15); border-radius: 3px; z-index: 5; }
.lvl-pre { font-family: 'Orbitron', monospace; font-size: 7px; color: rgba(255,255,255,0.7); }
.lvl-num { font-family: 'Orbitron', monospace; font-size: 12px; font-weight: 900; color: #fde047; }

.unit-bot {
  /* Solid panel below the portrait — keeps name/HP/MP off the face */
  position: relative;
  flex-shrink: 0;
  padding: 4px 6px 6px;
  background: linear-gradient(180deg, rgba(14, 8, 28, 0.92), rgba(8, 4, 18, 1));
  border-top: 1px solid rgba(255, 200, 230, 0.1);
  z-index: 5;
}
.unit-name { font-size: 10px; font-weight: 800; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.7); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
.hpbar, .mpbar { position: relative; height: 7px; background: rgba(0,0,0,0.7); border-radius: 2px; overflow: hidden; margin-bottom: 2px; }
.mpbar { height: 5px; }
.hpbar-fill { position: absolute; top: 0; left: 0; bottom: 0; background: linear-gradient(90deg, #f87171, #dc2626); box-shadow: 0 0 5px rgba(248, 113, 113, 0.7); transition: width 0.4s ease; }
.mpbar-fill { position: absolute; top: 0; left: 0; bottom: 0; background: linear-gradient(90deg, #60a5fa, #1d4ed8); box-shadow: 0 0 5px rgba(96, 165, 250, 0.7); transition: width 0.4s ease; }
.hpbar-text, .mpbar-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'Orbitron', monospace; font-size: 7px; font-weight: 700; color: white; text-shadow: 0 0 3px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1); }
.mpbar-text { font-size: 6px; }
.status-row { display: flex; gap: 2px; flex-wrap: wrap; margin-top: 1px; }
.status-chip { font-size: 7px; padding: 0 4px; background: rgba(252, 211, 77, 0.3); border-radius: 5px; color: #fde68a; }

/* ULT ring (conic gradient progress) */
.ult-ring {
  position: absolute;
  top: 4px; right: 4px;
  width: 26px; height: 26px;
  border-radius: 50%;
  background: conic-gradient(from -90deg, #fde047 var(--p), rgba(255,255,255,0.15) var(--p));
  border: 1.5px solid #fde047;
  z-index: 4;
  box-shadow: 0 0 8px rgba(253, 224, 71, 0.5);
  mask: radial-gradient(circle, transparent 8px, black 8px);
  -webkit-mask: radial-gradient(circle, transparent 8px, black 8px);
  pointer-events: none;
}
.ult-ready {
  position: absolute;
  top: 4px; right: 4px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #fde047, #f59e0b);
  border-radius: 4px;
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  font-weight: 900;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  box-shadow: 0 0 14px rgba(253, 224, 71, 0.8);
  animation: ult-pulse 1.4s ease-in-out infinite;
  z-index: 6;
}
@keyframes ult-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }

/* BREAK gauge */
.break-bar {
  position: absolute;
  left: 4px; right: 4px; top: 28px;
  height: 4px;
  background: rgba(0,0,0,0.6);
  border-radius: 2px;
  z-index: 5;
  overflow: hidden;
}
.break-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #fde047, #f87171);
  box-shadow: 0 0 4px rgba(253, 224, 71, 0.7);
  transition: width 0.4s ease;
}
.broken-stamp {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  background: linear-gradient(135deg, #fde047, #f59e0b);
  color: white;
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 16px;
  padding: 4px 10px;
  border-radius: 4px;
  z-index: 12;
  box-shadow: 0 0 16px rgba(253, 224, 71, 0.8);
  letter-spacing: 0.15em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  animation: break-stamp 1.5s ease-in-out infinite;
}
@keyframes break-stamp { 0%, 100% { transform: translate(-50%, -50%) rotate(-15deg) scale(1); } 50% { transform: translate(-50%, -50%) rotate(-15deg) scale(1.05); } }

.weak-hint {
  position: absolute; top: 4px; right: 36px;
  display: flex; align-items: center; gap: 2px;
  padding: 1px 4px;
  background: linear-gradient(135deg, #f87171, #be123c);
  border-radius: 2px;
  font-size: 8px; font-weight: 900;
  letter-spacing: 0.1em;
  font-family: 'Orbitron', monospace;
  color: white;
  z-index: 6;
  animation: weak-pulse 1s ease-in-out infinite;
}
@keyframes weak-pulse { 0%, 100% { opacity: 0.85; } 50% { opacity: 1; transform: scale(1.05); } }

.unit-target-arrow, .unit-active-arrow {
  position: absolute; top: -8px; left: 50%; transform: translateX(-50%);
  width: 18px; height: 18px; border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  color: white; z-index: 10; animation: bob 0.8s ease-in-out infinite;
}
.unit-target-arrow { background: #f87171; transform: translateX(-50%) rotate(180deg); animation: bob-d 0.8s ease-in-out infinite; }
.unit-active-arrow { background: #60a5fa; }
@keyframes bob { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-3px); } }
@keyframes bob-d { 0%,100% { transform: translateX(-50%) rotate(180deg) translateY(0); } 50% { transform: translateX(-50%) rotate(180deg) translateY(-3px); } }

/* Damage popup */
.dpop { position: absolute; top: 30%; left: 50%; font-family: 'Orbitron', monospace; font-weight: 900; font-size: 1.3rem; pointer-events: none; z-index: 30; transform: translate(-50%, -50%); animation: float-up 1.3s cubic-bezier(.2,.7,.2,1) forwards; text-shadow: 0 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 10px currentColor; }
.dpop-crit { font-size: 2rem; }
.dpop small { color: #fde047; margin-left: 1px; }
.dpop-physical, .dpop-light { color: #fef3c7; }
.dpop-fire { color: #ff8c42; }
.dpop-water { color: #60a5fa; }
.dpop-wood { color: #4ade80; }
.dpop-dark { color: #c084fc; }
.dpop-heal { color: #6ee7b7; }
.dpop-from {
  display: inline-block;
  font-size: 0.45em;
  vertical-align: super;
  padding: 1px 4px;
  margin-right: 3px;
  background: rgba(0,0,0,0.7);
  border: 1px solid currentColor;
  border-radius: 2px;
  letter-spacing: 0.04em;
  text-shadow: none;
  font-weight: 800;
}
@keyframes float-up { 0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; } 15% { transform: translate(-50%, -70%) scale(1.3); opacity: 1; } 100% { transform: translate(-50%, -150%) scale(1); opacity: 0; } }

.unit-flash { position: absolute; inset: -15%; background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, currentColor 35%, transparent 70%); border-radius: 50%; mix-blend-mode: screen; animation: skill-burst 0.8s ease-out forwards; pointer-events: none; z-index: 8; }
@keyframes skill-burst { 0% { transform: scale(0); opacity: 0; } 30% { transform: scale(1.5); opacity: 1; } 100% { transform: scale(2.5); opacity: 0; } }

/* LOG */
.bt-log-section { padding: 0 0.85rem; flex-shrink: 0; }
.bt-log { height: 70px; overflow-y: auto; padding: 0.45rem 0.7rem; background: linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.4)); border: 1px solid rgba(255,255,255,0.06); border-radius: 5px; backdrop-filter: blur(6px); font-family: 'M PLUS Rounded 1c', monospace; font-size: 10.5px; line-height: 1.55; }
.bt-log::-webkit-scrollbar { width: 4px; }
.bt-log::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
.log-line { color: rgba(255,255,255,0.75); }
.log-damage { color: #fca5a5; }
.log-heal { color: #6ee7b7; }
.log-skill { color: #f9a8d4; font-weight: 700; }
.log-ult { color: #fde047; font-weight: 800; }
.log-break { color: #fde047; }
.log-status { color: #fde68a; }
.log-victory { color: #6ee7b7; font-weight: 800; }
.log-defeat { color: #fb7185; font-weight: 800; }

/* ACTION */
.action-panel { margin: 0.4rem 0.85rem 0.4rem; padding: 0.6rem 0.75rem; background: linear-gradient(180deg, rgba(31, 21, 56, 0.95), rgba(15, 8, 30, 0.98)); border: 1px solid rgba(255, 200, 230, 0.15); border-radius: 10px; backdrop-filter: blur(12px); flex-shrink: 0; }
.action-title { display: flex; align-items: baseline; gap: 0.4rem; margin-bottom: 0.4rem; }
.action-eyebrow { font-family: 'Orbitron', monospace; font-size: 8px; letter-spacing: 0.3em; color: rgba(255, 200, 230, 0.7); padding: 1px 5px; background: rgba(255, 107, 157, 0.15); border-radius: 3px; }
.action-actor { font-weight: 800; font-size: 0.85rem; background: linear-gradient(135deg, #ffacd0, #ff6b9d); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.action-progress { margin-left: auto; font-family: 'Orbitron', monospace; font-size: 11px; color: rgba(255, 255, 255, 0.6); }

.skill-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 0.3rem; margin-bottom: 0.5rem; max-height: 100px; overflow-y: auto; }
.skill-grid::-webkit-scrollbar { width: 4px; }
.skill-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
.skill-tile { display: flex; align-items: center; gap: 0.4rem; padding: 0.4rem 0.55rem; background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); border: 1px solid rgba(255,255,255,0.1); border-radius: 5px; text-align: left; transition: all 0.2s ease; cursor: pointer; }
.skill-tile:hover:not(:disabled) { background: rgba(255,107,157,0.15); border-color: rgba(255,107,157,0.5); }
.skill-tile--selected { background: linear-gradient(135deg, rgba(255,107,157,0.28), rgba(157,107,255,0.22)); border-color: #ff6b9d; box-shadow: 0 0 12px rgba(255,107,157,0.5); }
.skill-tile--disabled { opacity: 0.35; cursor: not-allowed; }
.skill-tile--ult {
  background: linear-gradient(135deg, rgba(253, 224, 71, 0.25), rgba(245, 158, 11, 0.15));
  border-color: #fde047;
  box-shadow: 0 0 12px rgba(253, 224, 71, 0.5);
}
.skill-tile--ult.skill-tile--selected {
  background: linear-gradient(135deg, rgba(253, 224, 71, 0.4), rgba(248, 113, 113, 0.3));
}
.skill-icon { width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); border-radius: 4px; flex-shrink: 0; }
.skill-tile--fire .skill-icon { color: #ff8c42; }
.skill-tile--water .skill-icon { color: #60a5fa; }
.skill-tile--wood .skill-icon { color: #4ade80; }
.skill-tile--light .skill-icon { color: #fde68a; }
.skill-tile--dark .skill-icon { color: #c084fc; }
.skill-tile--ult .skill-icon { color: #fde047; }
.skill-text { flex: 1; min-width: 0; }
.skill-name { font-size: 0.78rem; font-weight: 700; color: white; }
.skill-desc { font-size: 9px; color: rgba(255,255,255,0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.skill-mp { flex-shrink: 0; font-family: 'Orbitron', monospace; font-weight: 900; color: #60a5fa; font-size: 0.95rem; text-shadow: 0 0 6px rgba(96,165,250,0.6); }
.skill-mp small { font-size: 7px; color: rgba(255,255,255,0.4); margin-left: 1px; }
.skill-mp.ult-tag {
  color: #fde047;
  text-shadow: 0 0 8px rgba(253, 224, 71, 0.7);
  font-size: 0.9rem;
  letter-spacing: 0.1em;
}

/* Skill detail panel */
.skill-info {
  margin: 0.4rem 0 0.5rem;
  padding: 0.55rem 0.7rem;
  background: linear-gradient(135deg, rgba(0,0,0,0.7), rgba(15,8,30,0.85));
  border: 1px solid var(--si-c, rgba(255, 200, 230, 0.4));
  border-left: 3px solid var(--si-c, #ff6b9d);
  border-radius: 5px;
  backdrop-filter: blur(8px);
}
.skill-info--fire { --si-c: #ff8c42; }
.skill-info--water { --si-c: #60a5fa; }
.skill-info--wood { --si-c: #4ade80; }
.skill-info--light { --si-c: #fde047; }
.skill-info--dark { --si-c: #c084fc; }
.si-head {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; margin-bottom: 4px;
}
.si-name {
  font-weight: 900; font-size: 14px;
  color: white;
  text-shadow: 0 0 8px var(--si-c);
}
.si-kind {
  font-family: 'Orbitron', monospace;
  font-size: 9px; letter-spacing: 0.2em;
  padding: 1px 5px;
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  color: rgba(255,255,255,0.7);
}
.si-mp, .si-cd, .si-ult {
  font-family: 'Orbitron', monospace;
  font-size: 10px; font-weight: 800;
  padding: 1px 6px;
  border-radius: 3px;
}
.si-mp { background: rgba(96, 165, 250, 0.25); color: #93c5fd; border: 1px solid rgba(96,165,250,0.4); }
.si-cd { background: rgba(255, 200, 230, 0.15); color: #f9a8d4; border: 1px solid rgba(255, 107, 157, 0.4); }
.si-ult { background: linear-gradient(135deg, #fde047, #f59e0b); color: white; }
.si-desc {
  font-size: 11.5px;
  color: rgba(255,255,255,0.9);
  line-height: 1.5;
  margin-bottom: 5px;
}
.si-effects {
  display: flex; flex-wrap: wrap; gap: 4px;
  margin-bottom: 4px;
}
.si-effect-chip {
  font-size: 10px;
  padding: 1px 6px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 3px;
  color: rgba(255,255,255,0.85);
}
.si-target {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.15em;
  color: rgba(255, 200, 230, 0.65);
}
.skillinfo-enter-active, .skillinfo-leave-active { transition: all 0.2s ease; }
.skillinfo-enter-from, .skillinfo-leave-to { opacity: 0; transform: translateY(-4px); }

.cmd-bar { display: flex; gap: 0.35rem; flex-wrap: wrap; }
.cmd { display: flex; align-items: center; gap: 0.3rem; padding: 0.5rem 0.85rem; border: 1px solid; border-radius: 4px; font-weight: 700; font-size: 0.82rem; transition: all 0.2s ease; clip-path: polygon(5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px), 0 5px); }
.cmd--attack { flex: 2; background: linear-gradient(135deg, #ff6b9d 0%, #c34dff 100%); border-color: transparent; color: white; box-shadow: 0 4px 14px rgba(255, 107, 157, 0.5); }
.cmd--attack:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
.cmd--alt { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); }
.cmd--alt:hover:not(:disabled) { background: rgba(255, 107, 157, 0.18); border-color: rgba(255, 107, 157, 0.45); }
.cmd--prev { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); padding: 0.5rem 0.7rem; }
.cmd:disabled { opacity: 0.4; cursor: not-allowed; }

.submenu { margin-top: 0.45rem; padding: 0.45rem 0.6rem; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.06); border-radius: 5px; }
.submenu-target { display: flex; align-items: center; gap: 0.35rem; font-size: 11px; color: rgba(255, 200, 230, 0.7); margin-bottom: 0.3rem; }
.submenu-target b { color: white; }
.submenu-items { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.submenu-item { display: flex; align-items: center; gap: 0.3rem; padding: 0.3rem 0.6rem; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 4px; font-size: 10.5px; }
.submenu-item:hover { background: rgba(255, 107, 157, 0.2); border-color: rgba(255, 107, 157, 0.5); }
.submenu-count { color: rgba(255,255,255,0.5); }
.submenu-prob { color: #fde047; font-weight: 700; }

/* RESULT */
.result-overlay { position: absolute; inset: 0; z-index: 50; background: rgba(0,0,0,0.85); backdrop-filter: blur(14px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
.result-card { max-width: 440px; width: 100%; background: linear-gradient(180deg, rgba(31, 21, 56, 0.98), rgba(10, 5, 20, 0.98)); border: 1px solid rgba(255, 107, 157, 0.5); border-radius: 10px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 50px rgba(255, 107, 157, 0.3); animation: result-in 0.6s cubic-bezier(.2,.9,.3,1.2); }
@keyframes result-in { 0% { opacity: 0; transform: scale(0.85) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
.result-banner { display: flex; align-items: center; justify-content: center; gap: 0.7rem; padding: 1.1rem 1rem; font-family: 'Orbitron', monospace; font-weight: 900; font-size: 1.6rem; letter-spacing: 0.2em; text-shadow: 0 0 22px currentColor; }
.result-win { color: #6ee7b7; background: linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(5, 150, 105, 0.2)); }
.result-lose { color: #fb7185; background: linear-gradient(135deg, rgba(225, 29, 72, 0.35), rgba(159, 18, 57, 0.2)); }
.result-body { padding: 0.85rem 1rem; }
.reward-row { display: flex; gap: 0.5rem; margin-bottom: 0.65rem; }
.reward { flex: 1; display: flex; align-items: center; gap: 0.55rem; padding: 0.55rem 0.75rem; border: 1px solid; border-radius: 6px; }
.reward-gold { background: linear-gradient(135deg, rgba(251,191,36,0.2), rgba(180,83,9,0.15)); border-color: rgba(251,191,36,0.5); color: #fde68a; }
.reward-exp { background: linear-gradient(135deg, rgba(96,165,250,0.2), rgba(29,78,216,0.15)); border-color: rgba(96,165,250,0.5); color: #bfdbfe; }
.reward-label { font-family: 'Orbitron', monospace; font-size: 8px; letter-spacing: 0.25em; color: rgba(255,255,255,0.5); }
.reward-val { font-family: 'Orbitron', monospace; font-size: 1.25rem; font-weight: 900; text-shadow: 0 0 10px currentColor; }
.captured { display: flex; align-items: center; gap: 0.65rem; padding: 0.6rem; background: linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(192, 38, 211, 0.15)); border: 1px solid rgba(236, 72, 153, 0.5); border-radius: 6px; color: #f9a8d4; margin-bottom: 0.65rem; }
.cap-label { font-family: 'Orbitron', monospace; font-size: 8px; letter-spacing: 0.25em; color: rgba(255,255,255,0.6); }
.cap-name { font-weight: 800; color: white; margin: 1px 0; font-size: 0.88rem; }
.event-list { display: flex; flex-direction: column; gap: 0.3rem; max-height: 100px; overflow-y: auto; }
.event-row { padding: 0.4rem 0.6rem; background: rgba(0,0,0,0.35); border-left: 3px solid #ff6b9d; border-radius: 3px; }
.event-name { font-weight: 800; font-size: 0.8rem; margin-bottom: 1px; }
.event-line { font-size: 10.5px; }
.ev-up { color: #6ee7b7; }
.ev-evo { color: #f9a8d4; font-weight: 700; }
.ev-skill { color: #fde68a; }
.result-actions { display: flex; gap: 0.4rem; justify-content: center; padding: 0.7rem 1rem 1rem; }
</style>
