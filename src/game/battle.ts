// =====================================================================
//  Battle Engine v2 — Strategic Combat
// =====================================================================
//  Flow per turn:
//   1. Player plans each ally's action (skill + target)
//   2. Enemy AI plans its actions
//   3. Engine resolves all actions in SPD order
//   4. Status effects tick
//   5. Cooldowns decrement
//   6. ULT gauge updates per actor
//   7. Break gauge / broken state updates
// =====================================================================

import type { BattleUnit, PlannedAction, ActiveStatus } from "./types";
import {
  SKILLS, type Skill, type SkillEffect, type StatusId,
  elementMul, STATUS_KIND,
} from "./data/skills";
import { type Rarity } from "./data/characters";

export interface BattleLog {
  text: string;
  kind?: "info" | "damage" | "heal" | "skill" | "status" | "capture" | "victory" | "defeat" | "ult" | "break";
}

export interface BattleEvent {
  type:
    | "damage"
    | "heal"
    | "miss"
    | "status_applied"
    | "status_expired"
    | "status_tick"
    | "ult_used"
    | "ult_ready"
    | "broken"
    | "broken_recovered"
    | "fallen"
    | "shield_absorbed"
    | "revived";
  unit?: BattleUnit;
  actor?: BattleUnit;
  amount?: number;
  status?: StatusId;
  skillId?: string;
  isCritical?: boolean;
  isWeakness?: boolean;
}

export type EncounterType = "trash" | "elite" | "boss";

export interface BattleState {
  allies: BattleUnit[];
  enemies: BattleUnit[];
  turn: number;
  phase: "planning" | "resolving" | "end_victory" | "end_defeat" | "fled";
  log: BattleLog[];
  events: BattleEvent[];           // events from last resolution (for UI animation)
  capturedUnit?: BattleUnit;
  plannedActions: Map<BattleUnit, PlannedAction>; // ally plans this turn
  encounterType: EncounterType;    // drives HP/ATK mods + UI pacing
}

const CATCH_BASE: Record<Rarity, number> = {
  N: 60, R: 35, SR: 15, SSR: 5, UR: 1,
};

const ULT_FULL = 100;
const BREAK_FULL = 100;

export function createBattle(allies: BattleUnit[], enemies: BattleUnit[], encounterType: EncounterType = "trash"): BattleState {
  // Apply encounter-type modifiers to enemies before snapshotting.
  // trash: -35% HP, normal ATK            (snappy fights)
  // elite: +20% HP, +10% ATK             (mid-boss feel)
  // boss : +120% HP, +20% ATK, +20% DEF   (climactic)
  const enemyMod = (u: BattleUnit, idx: number): BattleUnit => {
    let hpMul = 1, atkMul = 1, defMul = 1;
    if (encounterType === "trash") { hpMul = 0.65; }
    else if (encounterType === "elite") { hpMul = 1.20; atkMul = 1.10; }
    else if (encounterType === "boss") {
      // The first enemy in a boss encounter is THE boss; minions stay light
      if (idx === 0) { hpMul = 2.20; atkMul = 1.20; defMul = 1.20; }
      else { hpMul = 0.55; } // boss minions die fast
    }
    const newHpMax = Math.floor(u.hpMax * hpMul);
    return {
      ...u,
      hp: newHpMax,
      hpMax: newHpMax,
      stats: {
        ...u.stats,
        atk: Math.floor(u.stats.atk * atkMul),
        def: Math.floor(u.stats.def * defMul),
      },
      statuses: [],
      cooldowns: {},
    };
  };

  return {
    allies: allies.map(u => ({ ...u, statuses: [], cooldowns: {} })),
    enemies: enemies.map(enemyMod),
    turn: 1,
    phase: "planning",
    log: [{
      text: encounterType === "boss"
        ? `▶ BOSS BATTLE! vs ${enemies.map(e => e.name).join(", ")}`
        : encounterType === "elite"
        ? `▶ ELITE戦！ vs ${enemies.map(e => e.name).join(", ")}`
        : `▶ 戦闘開始！ vs ${enemies.map(e => e.name).join(", ")}`,
      kind: "info",
    }],
    events: [],
    plannedActions: new Map(),
    encounterType,
  };
}

// =====================================================================
//  Helpers
// =====================================================================

function isAlive(u: BattleUnit) { return u.hp > 0; }
function aliveOf(side: BattleUnit[]) { return side.filter(isAlive); }

function effectiveStat(unit: BattleUnit, stat: "atk" | "def" | "spd" | "mag"): number {
  const base = unit.stats[stat];
  let pct = 0;
  for (const s of unit.statuses) {
    if (s.stat === stat && typeof s.pct === "number") pct += s.pct;
  }
  return Math.max(1, Math.round(base * (1 + pct / 100)));
}

function hasStatus(unit: BattleUnit, id: StatusId): ActiveStatus | undefined {
  return unit.statuses.find(s => s.status === id);
}

function addOrRefreshStatus(unit: BattleUnit, st: ActiveStatus, logs: BattleLog[], events: BattleEvent[]): boolean {
  const existing = unit.statuses.find(s => s.status === st.status);
  if (existing) {
    existing.turns = Math.max(existing.turns, st.turns);
    if (st.shieldHp != null) existing.shieldHp = Math.max(existing.shieldHp ?? 0, st.shieldHp);
    if (st.pct != null) existing.pct = st.pct;
    return false;
  }
  unit.statuses.push({ ...st });
  events.push({ type: "status_applied", unit, status: st.status });
  logs.push({ text: `${unit.name} は ${statusName(st.status)} になった！`, kind: "status" });
  return true;
}

function statusName(id: StatusId): string {
  const m: Record<StatusId, string> = {
    burn: "やけど", freeze: "凍結", poison: "毒",
    stun: "スタン", silence: "沈黙",
    weaken: "攻撃↓", fragile: "防御↓", slow: "速度↓",
    regen: "再生", shield: "盾", taunt: "挑発", barrier: "障壁",
  };
  return m[id];
}

// =====================================================================
//  Action planning
// =====================================================================

export function planAction(state: BattleState, action: PlannedAction) {
  state.plannedActions.set(action.actor, action);
}

export function unplanAction(state: BattleState, actor: BattleUnit) {
  state.plannedActions.delete(actor);
}

export function isFullyPlanned(state: BattleState): boolean {
  const aliveAllies = aliveOf(state.allies);
  return aliveAllies.every(a => state.plannedActions.has(a));
}

// =====================================================================
//  AI for enemy planning
// =====================================================================

function aiPlan(state: BattleState, actor: BattleUnit): PlannedAction {
  const opp = aliveOf(state.allies);
  const same = aliveOf(state.enemies);

  // 1. If ult ready, prioritise ult
  if (actor.ultGauge >= ULT_FULL) {
    const ult = SKILLS[actor.ultId];
    if (ult) {
      return makeAiAction(actor, ult, opp, same);
    }
  }
  // 2. Otherwise pick a usable role-appropriate skill
  const usable = actor.skills
    .map(id => SKILLS[id])
    .filter(s => s && actor.mp >= s.mpCost && (actor.cooldowns[s.id] ?? 0) === 0) as Skill[];

  if (usable.length === 0) {
    return { actor, kind: "skill", skillId: "s_strike", targetUnits: [opp[Math.floor(Math.random() * opp.length)]] };
  }

  // Prefer role-fitting skills
  const roleSkills = usable.filter(s => {
    switch (actor.role) {
      case "healer":   return s.kind === "heal" && same.some(a => a.hp / a.hpMax < 0.6);
      case "buffer":   return s.kind === "buff" || s.kind === "support";
      case "debuffer": return s.kind === "debuff";
      case "mage":     return s.kind === "attack";
      case "tank":     return s.kind === "support" || s.kind === "attack";
      default:         return s.kind === "attack";
    }
  });

  const pool = roleSkills.length > 0 ? roleSkills : usable.filter(s => s.kind === "attack" || s.kind === "debuff");
  if (pool.length === 0) {
    return { actor, kind: "skill", skillId: "s_strike", targetUnits: [opp[0]] };
  }
  const skill = pool[Math.floor(Math.random() * pool.length)];
  return makeAiAction(actor, skill, opp, same);
}

function makeAiAction(actor: BattleUnit, skill: Skill, opp: BattleUnit[], same: BattleUnit[]): PlannedAction {
  let targets: BattleUnit[] = [];
  switch (skill.target) {
    case "single_enemy":
      // taunt redirect
      const taunter = opp.find(u => hasStatus(u, "taunt"));
      targets = [taunter ?? opp[Math.floor(Math.random() * opp.length)]];
      break;
    case "all_enemies":
      targets = [...opp];
      break;
    case "single_ally":
    case "lowest_hp_ally":
      targets = [same.slice().sort((a, b) => a.hp / a.hpMax - b.hp / b.hpMax)[0] ?? same[0]];
      break;
    case "all_allies":
      targets = [...same];
      break;
    case "self":
      targets = [actor];
      break;
    case "single_dead_ally":
      targets = same.filter(u => u.hp === 0);
      break;
  }
  return { actor, kind: "skill", skillId: skill.id, targetUnits: targets };
}

// =====================================================================
//  Turn resolution
// =====================================================================

export function planEnemies(state: BattleState) {
  for (const e of aliveOf(state.enemies)) {
    state.plannedActions.set(e, aiPlan(state, e));
  }
}

export function resolveTurn(state: BattleState): BattleEvent[] {
  state.events = [];
  state.phase = "resolving";

  // Build action order by effective SPD desc + tiny random jitter
  const allActors = [...aliveOf(state.allies), ...aliveOf(state.enemies)]
    .filter(a => state.plannedActions.has(a));
  allActors.sort((a, b) => effectiveStat(b, "spd") - effectiveStat(a, "spd") + Math.random() - 0.5);

  const logs: BattleLog[] = [];

  for (const actor of allActors) {
    if (!isAlive(actor)) continue;
    if (state.phase !== "resolving" && state.phase !== "planning") break;

    // Status-based action skip
    const stun = hasStatus(actor, "stun");
    if (stun) { logs.push({ text: `${actor.name} はスタンで動けない！`, kind: "status" }); continue; }
    const freeze = hasStatus(actor, "freeze");
    if (freeze && Math.random() < 0.5) {
      logs.push({ text: `${actor.name} は凍結で動けない！`, kind: "status" });
      continue;
    }

    // Broken units skip their action
    if (actor.broken) {
      logs.push({ text: `${actor.name} はブレイク状態で行動不能！`, kind: "break" });
      continue;
    }

    const plan = state.plannedActions.get(actor);
    if (!plan) continue;

    if (plan.kind === "defend") {
      logs.push({ text: `${actor.name} は防御態勢に入った！`, kind: "info" });
      addOrRefreshStatus(actor, { status: "barrier", turns: 1 }, logs, state.events);
      continue;
    }

    if (plan.kind === "skill" && plan.skillId) {
      const skill = SKILLS[plan.skillId];
      if (!skill) continue;
      // Silence prevents non-basic skills (allow basic attack only)
      if (hasStatus(actor, "silence") && skill.id !== "s_strike") {
        logs.push({ text: `${actor.name} は沈黙していて技を使えない！`, kind: "status" });
        continue;
      }
      // Cost / cooldown
      if (skill.ultimate) {
        if (actor.ultGauge < ULT_FULL) continue;
        actor.ultGauge = 0;
        logs.push({ text: `${actor.name} の必殺技 ${skill.name}！`, kind: "ult" });
        state.events.push({ type: "ult_used", actor, skillId: skill.id });
      } else {
        if (actor.mp < skill.mpCost) continue;
        actor.mp -= skill.mpCost;
        logs.push({ text: `${actor.name} は ${skill.name} を放った！`, kind: "skill" });
      }
      // Cooldown
      if (skill.cooldown && skill.cooldown > 0) {
        actor.cooldowns[skill.id] = skill.cooldown;
      }

      // Apply each effect to each target
      const targets = plan.targetUnits?.filter(isAlive) ?? [];
      // For revive effects target may be dead
      const reviveTargets = plan.targetUnits?.filter(u => u.hp === 0) ?? [];

      for (const effect of skill.effects) {
        applyEffect(state, actor, skill, effect, targets, reviveTargets, logs);
      }

      // Ult gauge gain for non-ult actions
      if (!skill.ultimate) {
        actor.ultGauge = Math.min(ULT_FULL, actor.ultGauge + 12);
        if (actor.ultGauge >= ULT_FULL) {
          state.events.push({ type: "ult_ready", actor });
        }
      }

      // Win/lose check after every effect chain
      if (aliveOf(state.allies).length === 0) {
        state.phase = "end_defeat";
        logs.push({ text: "敗北… パーティが全滅した。", kind: "defeat" });
        break;
      }
      if (aliveOf(state.enemies).length === 0) {
        state.phase = "end_victory";
        logs.push({ text: "勝利！ 敵を全て倒した！", kind: "victory" });
        break;
      }
    }
  }

  // End-of-turn tick
  if (state.phase === "resolving") {
    endOfTurnTick(state, logs);
    if (aliveOf(state.allies).length === 0) {
      state.phase = "end_defeat";
      logs.push({ text: "敗北… パーティが全滅した。", kind: "defeat" });
    } else if (aliveOf(state.enemies).length === 0) {
      state.phase = "end_victory";
      logs.push({ text: "勝利！ 敵を全て倒した！", kind: "victory" });
    } else {
      state.phase = "planning";
      state.plannedActions.clear();
      state.turn += 1;
    }
  }

  state.log.push(...logs);
  return state.events;
}

function applyEffect(state: BattleState, actor: BattleUnit, skill: Skill, effect: SkillEffect, targets: BattleUnit[], reviveTargets: BattleUnit[], logs: BattleLog[]) {
  switch (effect.type) {
    case "damage": {
      for (const t of targets) {
        const isMagical = skill.kind === "ult" || skill.kind === "attack" && (effectiveStat(actor, "mag") > effectiveStat(actor, "atk") * 1.2);
        const atkStat = isMagical ? effectiveStat(actor, "mag") : effectiveStat(actor, "atk");
        const defStat = effectiveStat(t, "def");
        const elemAdv = elementMul(skill.element, t.element);
        const isWeak = elemAdv > 1;
        const isResist = elemAdv < 1;
        // Critical hit
        const critChance = 0.08 + (effectiveStat(actor, "spd") - effectiveStat(t, "spd")) * 0.001;
        const isCritical = Math.random() < Math.max(0.04, Math.min(0.3, critChance));
        const critMul = isCritical ? 1.6 : 1.0;
        const breakMul = t.broken ? 1.5 : 1.0;
        // Barrier halves dmg
        const barrierMul = hasStatus(t, "barrier") ? 0.5 : 1.0;
        const variance = 0.92 + Math.random() * 0.16;
        const power = effect.power ?? 0;
        const raw = power * (atkStat / Math.max(1, defStat * 0.75 + 30)) * elemAdv * critMul * breakMul * barrierMul * variance;
        let dmg = Math.max(1, Math.floor(raw / 1.5));
        // Shield absorbs first
        const shield = t.statuses.find(s => s.status === "shield");
        if (shield && shield.shieldHp && shield.shieldHp > 0) {
          const absorbed = Math.min(dmg, shield.shieldHp);
          shield.shieldHp -= absorbed;
          dmg -= absorbed;
          state.events.push({ type: "shield_absorbed", unit: t, amount: absorbed });
          if (shield.shieldHp <= 0) {
            t.statuses = t.statuses.filter(s => s !== shield);
          }
        }
        t.hp = Math.max(0, t.hp - dmg);
        state.events.push({ type: "damage", actor, unit: t, amount: dmg, isCritical, isWeakness: isWeak, skillId: skill.id });
        const tag = isCritical ? "(CRITICAL!) " : "";
        const elemTag = isWeak ? "(効果は抜群！)" : isResist ? "(今ひとつ…)" : "";
        logs.push({ text: `${tag}${t.name} に ${dmg} ダメージ ${elemTag}`, kind: "damage" });
        // Break gauge fill on weakness hits
        if (isWeak && !t.broken && t.isWild === false) {
          // player attacking enemy: skip (we want PLAYER's hits on enemies to fill enemy break)
        }
        if (isWeak && !t.broken) {
          t.breakGauge = Math.min(BREAK_FULL, t.breakGauge + 35);
          if (t.breakGauge >= BREAK_FULL) {
            t.broken = true;
            t.brokenTurnsRemaining = 2;
            t.breakGauge = 0;
            state.events.push({ type: "broken", unit: t });
            logs.push({ text: `★ ${t.name} はブレイクした！(2T行動不能)`, kind: "break" });
          }
        }
        // KO
        if (t.hp === 0) {
          state.events.push({ type: "fallen", unit: t });
          logs.push({ text: `${t.name} は倒れた！`, kind: "info" });
        }
        // KO check inside multi-hit skills
        if (aliveOf(state.allies).length === 0 || aliveOf(state.enemies).length === 0) return;
      }
      break;
    }
    case "heal": {
      for (const t of targets) {
        const mag = effectiveStat(actor, "mag");
        // Reduced scaling so healers don't out-heal damage trivially
        const raw = (effect.power ?? 0) * (1 + mag / 220);
        // Per-skill cap: cannot heal more than 55% of max HP in one cast
        const capped = Math.min(raw, t.hpMax * 0.55);
        const amount = Math.min(t.hpMax - t.hp, Math.floor(capped));
        t.hp += amount;
        state.events.push({ type: "heal", actor, unit: t, amount });
        logs.push({ text: `${t.name} のHPが ${amount} 回復！`, kind: "heal" });
      }
      break;
    }
    case "buff":
    case "debuff": {
      for (const t of targets) {
        const turns = effect.turns ?? 3;
        addOrRefreshStatus(t, {
          status: effect.type === "buff" ? "regen" : "weaken", // placeholder; real stat status:
          // We map stat-buff/debuff to a generic ActiveStatus with stat+pct fields, not a registered StatusId.
          // To keep types clean, we encode as a unique status id using "regen"/"weaken" as the kind tag.
          // But to truly stack stats, we just push an arbitrary ActiveStatus with stat/pct fields directly:
          turns,
          stat: effect.stat,
          pct: effect.pct,
        }, logs, state.events);
        // Replace tag with a more accurate one for display
        const last = t.statuses[t.statuses.length - 1];
        if (last && effect.stat && typeof effect.pct === "number") {
          last.status = (effect.pct >= 0 ? `${effect.stat}_up` : `${effect.stat}_down`) as StatusId;
        }
        logs.push({ text: `${t.name} の${labelStat(effect.stat ?? "atk")}が${(effect.pct ?? 0) > 0 ? "上昇" : "低下"}！`, kind: "status" });
      }
      break;
    }
    case "status": {
      for (const t of targets) {
        if (!effect.status) continue;
        if (Math.random() < (effect.chance ?? 1)) {
          addOrRefreshStatus(t, { status: effect.status, turns: effect.turns ?? 3 }, logs, state.events);
        }
      }
      break;
    }
    case "shield": {
      for (const t of targets) {
        addOrRefreshStatus(t, {
          status: "shield",
          turns: effect.turns ?? 2,
          shieldHp: effect.shieldAmount ?? 100,
        }, logs, state.events);
      }
      break;
    }
    case "cleanse": {
      for (const t of targets) {
        const cleansed = t.statuses.filter(s => STATUS_KIND[s.status as StatusId] === "debuff");
        t.statuses = t.statuses.filter(s => STATUS_KIND[s.status as StatusId] !== "debuff");
        if (cleansed.length) logs.push({ text: `${t.name} の状態異常が解除された`, kind: "status" });
      }
      break;
    }
    case "revive": {
      for (const t of reviveTargets) {
        if (t.hp > 0) continue;
        const restore = Math.floor(t.hpMax * (effect.revivePct ?? 50) / 100);
        t.hp = restore;
        state.events.push({ type: "revived", unit: t });
        logs.push({ text: `${t.name} は復活した！`, kind: "heal" });
      }
      break;
    }
    case "taunt": {
      for (const t of targets) {
        addOrRefreshStatus(t, { status: "taunt", turns: effect.turns ?? 2 }, logs, state.events);
      }
      break;
    }
    case "ult_charge": {
      for (const t of targets) {
        t.ultGauge = Math.min(ULT_FULL, t.ultGauge + (effect.ultGain ?? 20));
        if (t.ultGauge >= ULT_FULL) state.events.push({ type: "ult_ready", actor: t });
      }
      break;
    }
  }
}

function labelStat(s: string): string {
  return { atk: "攻撃力", def: "防御力", spd: "素早さ", mag: "魔力" }[s] ?? s;
}

function endOfTurnTick(state: BattleState, logs: BattleLog[]) {
  for (const u of [...state.allies, ...state.enemies]) {
    if (!isAlive(u)) continue;
    // DoT / regen tick
    for (const s of u.statuses) {
      if (s.turns <= 0) continue;
      if (s.status === "burn") {
        const dmg = Math.max(1, Math.floor(u.hpMax * 0.06));
        u.hp = Math.max(0, u.hp - dmg);
        state.events.push({ type: "status_tick", unit: u, status: "burn", amount: dmg });
        logs.push({ text: `${u.name} はやけどで ${dmg} ダメージ`, kind: "damage" });
      }
      if (s.status === "poison") {
        const dmg = Math.max(1, Math.floor(u.hpMax * 0.05));
        u.hp = Math.max(0, u.hp - dmg);
        state.events.push({ type: "status_tick", unit: u, status: "poison", amount: dmg });
        logs.push({ text: `${u.name} は毒で ${dmg} ダメージ`, kind: "damage" });
      }
      if (s.status === "regen") {
        const heal = Math.min(u.hpMax - u.hp, Math.floor(u.hpMax * 0.06));
        u.hp += heal;
        state.events.push({ type: "status_tick", unit: u, status: "regen", amount: heal });
        if (heal > 0) logs.push({ text: `${u.name} は再生で ${heal} 回復`, kind: "heal" });
      }
      s.turns -= 1;
    }
    u.statuses = u.statuses.filter(s => s.turns > 0);

    // Broken tick
    if (u.broken) {
      u.brokenTurnsRemaining -= 1;
      if (u.brokenTurnsRemaining <= 0) {
        u.broken = false;
        state.events.push({ type: "broken_recovered", unit: u });
        logs.push({ text: `${u.name} はブレイクから回復した`, kind: "break" });
      }
    }

    // Cooldown decrement
    for (const k of Object.keys(u.cooldowns)) {
      if (u.cooldowns[k] > 0) u.cooldowns[k]--;
      if (u.cooldowns[k] <= 0) delete u.cooldowns[k];
    }
  }
}

// =====================================================================
//  Capture
// =====================================================================

export function captureProbability(target: BattleUnit, itemMul: number): number {
  if (!target.isWild) return 0;
  const base = CATCH_BASE[target.rarity] / 100;
  const hpFactor = 1 - target.hp / target.hpMax;
  const lvlFactor = 1 / (1 + Math.max(0, target.level - 5) * 0.02);
  const statusBoost = (hasStatus(target, "freeze") || hasStatus(target, "stun") || hasStatus(target, "silence")) ? 1.3 : 1.0;
  const brokenBoost = target.broken ? 1.4 : 1.0;
  return Math.min(0.99, base * (0.2 + hpFactor * 0.8) * lvlFactor * itemMul * statusBoost * brokenBoost);
}

export function attemptCapture(state: BattleState, target: BattleUnit, itemMul: number): { success: boolean; chance: number; logs: BattleLog[] } {
  const logs: BattleLog[] = [];
  const p = captureProbability(target, itemMul);
  const success = Math.random() < p;
  logs.push({ text: `${target.name} に契約書を投げた！ (成功率 ${(p * 100).toFixed(1)}%)`, kind: "capture" });
  if (success) {
    state.capturedUnit = target;
    target.hp = 0;
    logs.push({ text: `やった！ ${target.name} を仲間にした！`, kind: "capture" });
  } else {
    logs.push({ text: "捕獲に失敗…！", kind: "capture" });
  }
  state.log.push(...logs);
  return { success, chance: p, logs };
}

// =====================================================================
//  Pre-resolution turn order preview (used by UI)
// =====================================================================

export function turnOrderPreview(state: BattleState): BattleUnit[] {
  return [...aliveOf(state.allies), ...aliveOf(state.enemies)]
    .filter(u => !u.broken)
    .sort((a, b) => effectiveStat(b, "spd") - effectiveStat(a, "spd"));
}

// =====================================================================
//  Re-export skill metadata helpers for UI
// =====================================================================

export { SKILLS };
