// Turn-based battle engine
import type { BattleUnit } from "./types";
import { SKILLS, ELEMENT_ADVANTAGE, type Skill } from "./data/skills";
import { type Rarity } from "./data/characters";
import { ITEMS } from "./data/items";

export interface BattleLog {
  text: string;
  kind?: "info" | "damage" | "heal" | "skill" | "status" | "capture" | "victory" | "defeat";
}

export interface BattleState {
  allies: BattleUnit[];
  enemies: BattleUnit[];
  turn: number;
  phase: "select" | "resolve" | "end_victory" | "end_defeat" | "fled";
  log: BattleLog[];
  // capture system
  capturedUnit?: BattleUnit;
}

const CATCH_BASE: Record<Rarity, number> = {
  N: 60, R: 35, SR: 15, SSR: 5, UR: 1,
};

export function createBattle(allies: BattleUnit[], enemies: BattleUnit[]): BattleState {
  return {
    allies: allies.map(u => ({ ...u })),
    enemies: enemies.map(u => ({ ...u })),
    turn: 1,
    phase: "select",
    log: [{ text: `▶ 戦闘開始！ vs ${enemies.map(e => e.name).join(", ")}`, kind: "info" }],
  };
}

function elementMultiplier(atkElement: string, defElement: string): number {
  if (ELEMENT_ADVANTAGE[atkElement as keyof typeof ELEMENT_ADVANTAGE] === defElement) return 1.5;
  if (ELEMENT_ADVANTAGE[defElement as keyof typeof ELEMENT_ADVANTAGE] === atkElement) return 0.7;
  return 1.0;
}

function effectiveStat(unit: BattleUnit, stat: "atk" | "def" | "spd" | "mag"): number {
  const base = unit.stats[stat];
  const bonus = unit.buffs.filter(b => b.stat === stat).reduce((a, b) => a + b.delta, 0);
  return Math.max(1, Math.round(base * (1 + bonus / 100)));
}

function isAlive(u: BattleUnit) { return u.hp > 0; }
function aliveOf(side: BattleUnit[]) { return side.filter(isAlive); }

export interface PendingAction {
  actor: BattleUnit;
  kind: "skill" | "capture" | "item" | "flee";
  skillId?: string;
  targetIndex?: number;     // index into the opposing side after filter
  itemId?: string;
  targetUnit?: BattleUnit;  // for direct reference
}

// Choose AI action for an enemy unit
function aiChooseAction(actor: BattleUnit, allies: BattleUnit[], enemies: BattleUnit[]): PendingAction {
  // Enemy actor's "allies" are battle.enemies; targets are battle.allies (the player)
  const targets = aliveOf(allies);
  if (!actor.skills.length || targets.length === 0) {
    return { actor, kind: "skill", skillId: "s_strike", targetUnit: targets[0] };
  }
  // Pick a usable skill weighted by power
  const usable = actor.skills
    .map(id => SKILLS[id])
    .filter(s => s && actor.mp >= s.mpCost) as Skill[];
  if (usable.length === 0) {
    return { actor, kind: "skill", skillId: "s_strike", targetUnit: targets[0] };
  }
  const skill = usable[Math.floor(Math.random() * usable.length)];
  let target = targets[Math.floor(Math.random() * targets.length)];
  if (skill.kind === "heal" || skill.kind === "buff") {
    const ownSide = aliveOf(enemies);
    target = ownSide[Math.floor(Math.random() * ownSide.length)];
  }
  return { actor, kind: "skill", skillId: skill.id, targetUnit: target };
}

// Resolve a single action; returns the produced log entries
function resolveAction(state: BattleState, action: PendingAction): BattleLog[] {
  const logs: BattleLog[] = [];
  const actor = action.actor;
  if (!isAlive(actor)) return logs;

  // Status effect tick: stun skips, burn damage at end of turn handled separately
  const stunned = actor.statusEffects.find(s => s.status === "stun" && s.turns > 0);
  if (stunned) {
    logs.push({ text: `${actor.name} はスタン状態で動けない！`, kind: "status" });
    return logs;
  }
  const frozen = actor.statusEffects.find(s => s.status === "freeze" && s.turns > 0);
  if (frozen && Math.random() < 0.5) {
    logs.push({ text: `${actor.name} は凍結しており動けない！`, kind: "status" });
    return logs;
  }

  // Item use
  if (action.kind === "item" && action.itemId) {
    const item = ITEMS[action.itemId];
    if (!item) return logs;
    if (item.kind === "capture") {
      return logs; // Capture is handled at a higher layer
    }
    if (item.kind === "consumable" && item.effect && action.targetUnit) {
      const t = action.targetUnit;
      if (item.effect.targetStat === "hp" && item.effect.amount) {
        const heal = Math.min(t.hpMax - t.hp, item.effect.amount);
        t.hp += heal;
        logs.push({ text: `${t.name} のHPが ${heal} 回復！`, kind: "heal" });
      } else if (item.effect.targetStat === "mp" && item.effect.amount) {
        const heal = Math.min(t.mpMax - t.mp, item.effect.amount);
        t.mp += heal;
        logs.push({ text: `${t.name} のMPが ${heal} 回復！`, kind: "heal" });
      }
    }
    return logs;
  }

  // Flee
  if (action.kind === "flee") {
    if (state.enemies.every(e => e.isWild)) {
      const fleeChance = 0.6;
      if (Math.random() < fleeChance) {
        state.phase = "fled";
        logs.push({ text: "うまく逃げ切った！", kind: "info" });
      } else {
        logs.push({ text: "逃げられない！", kind: "info" });
      }
    } else {
      logs.push({ text: "ボス戦からは逃げられない！", kind: "info" });
    }
    return logs;
  }

  // Skill
  if (action.kind === "skill" && action.skillId) {
    const skill = SKILLS[action.skillId];
    if (!skill) return logs;
    if (actor.mp < skill.mpCost) {
      logs.push({ text: `${actor.name} はMPが足りない！通常攻撃に変更。`, kind: "info" });
      // fallback
      const fallback = SKILLS["s_strike"];
      const oppSide = actor.side === "ally" ? state.enemies : state.allies;
      const tgt = action.targetUnit ?? aliveOf(oppSide)[0];
      return applySkill(state, actor, fallback, tgt ? [tgt] : []);
    }
    actor.mp -= skill.mpCost;
    let targets: BattleUnit[] = [];
    const oppSide = actor.side === "ally" ? state.enemies : state.allies;
    const sameSide = actor.side === "ally" ? state.allies : state.enemies;
    if (skill.target === "self") targets = [actor];
    else if (skill.kind === "heal" || skill.kind === "buff") {
      targets = skill.target === "all" ? aliveOf(sameSide) : action.targetUnit ? [action.targetUnit] : [aliveOf(sameSide)[0]];
    } else {
      targets = skill.target === "all" ? aliveOf(oppSide) : action.targetUnit ? [action.targetUnit] : [aliveOf(oppSide)[0]];
    }
    targets = targets.filter(isAlive);
    return applySkill(state, actor, skill, targets);
  }

  return logs;
}

function applySkill(_state: BattleState, actor: BattleUnit, skill: Skill, targets: BattleUnit[]): BattleLog[] {
  const logs: BattleLog[] = [];
  logs.push({ text: `${actor.name} は『${skill.name}』を使った！`, kind: "skill" });

  if (skill.kind === "attack") {
    for (const t of targets) {
      const atk = skill.element && skill.power >= 80 ? effectiveStat(actor, "mag") : effectiveStat(actor, "atk");
      const def = effectiveStat(t, "def");
      const elemMul = elementMultiplier(skill.element, t.element);
      const raw = (skill.power * (atk / Math.max(1, def))) * elemMul;
      const variance = 0.9 + Math.random() * 0.2;
      let dmg = Math.max(1, Math.floor(raw * variance / 4));
      t.hp = Math.max(0, t.hp - dmg);
      const eff = elemMul > 1 ? "(効果は抜群！)" : elemMul < 1 ? "(効果は今ひとつ…)" : "";
      logs.push({ text: `${t.name} に ${dmg} ダメージ ${eff}`, kind: "damage" });
      // status chance
      if (skill.effect?.statusChance && skill.effect.status && Math.random() < skill.effect.statusChance) {
        if (!t.statusEffects.find(s => s.status === skill.effect!.status)) {
          t.statusEffects.push({ status: skill.effect.status, turns: 3 });
          logs.push({ text: `${t.name} は ${labelStatus(skill.effect.status)} になった！`, kind: "status" });
        }
      }
    }
  } else if (skill.kind === "heal") {
    for (const t of targets) {
      const mag = effectiveStat(actor, "mag");
      const heal = Math.max(1, Math.floor(skill.power * (1 + mag / 100)));
      const applied = Math.min(t.hpMax - t.hp, heal);
      t.hp += applied;
      logs.push({ text: `${t.name} のHPが ${applied} 回復した！`, kind: "heal" });
    }
  } else if (skill.kind === "buff" && skill.effect?.stat && skill.effect.delta) {
    for (const t of targets) {
      t.buffs.push({ stat: skill.effect.stat, delta: skill.effect.delta, turns: skill.effect.duration ?? 3 });
      logs.push({ text: `${t.name} の${labelStat(skill.effect.stat)}が上がった！`, kind: "status" });
    }
  } else if (skill.kind === "debuff") {
    for (const t of targets) {
      if (skill.effect?.statusChance && skill.effect.status && Math.random() < skill.effect.statusChance) {
        if (!t.statusEffects.find(s => s.status === skill.effect!.status)) {
          t.statusEffects.push({ status: skill.effect.status, turns: 3 });
          logs.push({ text: `${t.name} は ${labelStatus(skill.effect.status)} になった！`, kind: "status" });
        }
      } else if (skill.effect?.stat && skill.effect.delta !== undefined) {
        t.buffs.push({ stat: skill.effect.stat, delta: skill.effect.delta, turns: skill.effect.duration ?? 3 });
        logs.push({ text: `${t.name} の${labelStat(skill.effect.stat)}が下がった！`, kind: "status" });
      }
    }
  }
  return logs;
}

function labelStat(s: string): string {
  return { atk: "攻撃力", def: "防御力", spd: "素早さ", mag: "魔力", hp: "HP", mp: "MP" }[s] ?? s;
}

function labelStatus(s: string): string {
  return { burn: "やけど", freeze: "凍結", stun: "スタン", poison: "毒" }[s] ?? s;
}

// Tick status effects and buffs at end of turn
function tickEnd(state: BattleState): BattleLog[] {
  const logs: BattleLog[] = [];
  for (const u of [...state.allies, ...state.enemies]) {
    if (!isAlive(u)) continue;
    // Burn / poison damage
    for (const s of u.statusEffects) {
      if (s.turns <= 0) continue;
      if (s.status === "burn" || s.status === "poison") {
        const dmg = Math.max(1, Math.floor(u.hpMax * 0.06));
        u.hp = Math.max(0, u.hp - dmg);
        logs.push({ text: `${u.name} は${labelStatus(s.status)}で ${dmg} ダメージ！`, kind: "damage" });
      }
      s.turns -= 1;
    }
    u.statusEffects = u.statusEffects.filter(s => s.turns > 0);
    for (const b of u.buffs) b.turns -= 1;
    u.buffs = u.buffs.filter(b => b.turns > 0);
  }
  return logs;
}

// Compute capture probability (0..1). Higher when enemy HP is low.
export function captureProbability(target: BattleUnit, itemMul: number): number {
  if (!target.isWild) return 0;
  const base = CATCH_BASE[target.rarity] / 100;
  const hpFactor = 1 - target.hp / target.hpMax;     // 0 (full) -> 1 (KO)
  const lvlFactor = 1 / (1 + Math.max(0, target.level - 5) * 0.02);
  // Status boost
  const statusBoost = target.statusEffects.some(s => s.status === "freeze" || s.status === "stun") ? 1.25 : 1.0;
  return Math.min(0.99, base * (0.2 + hpFactor * 0.8) * lvlFactor * itemMul * statusBoost);
}

export function attemptCapture(state: BattleState, target: BattleUnit, itemMul: number): { success: boolean; chance: number; logs: BattleLog[] } {
  const logs: BattleLog[] = [];
  const p = captureProbability(target, itemMul);
  const success = Math.random() < p;
  logs.push({ text: `${target.name} に契約書を投げた！ (成功率 ${(p * 100).toFixed(1)}%)`, kind: "capture" });
  if (success) {
    state.capturedUnit = target;
    target.hp = 0; // remove from battle
    logs.push({ text: `やった！ ${target.name} を仲間にした！`, kind: "capture" });
  } else {
    logs.push({ text: "捕獲に失敗…！", kind: "capture" });
  }
  return { success, chance: p, logs };
}

// Execute a player action and let enemies respond. Returns logs and updates state.
export function executeTurn(state: BattleState, playerAction: PendingAction): BattleLog[] {
  const logs: BattleLog[] = [];
  if (state.phase !== "select") return logs;

  // Build action list (player + enemy AI), sort by speed desc
  const enemyActions = state.enemies
    .filter(isAlive)
    .map(e => aiChooseAction(e, state.allies, state.enemies));
  const allActions = [playerAction, ...enemyActions].sort((a, b) => {
    const sa = effectiveStat(a.actor, "spd");
    const sb = effectiveStat(b.actor, "spd");
    return sb - sa;
  });

  for (const act of allActions) {
    if (state.phase !== "select") break; // could have fled or ended
    if (!isAlive(act.actor)) continue;
    if (state.capturedUnit && act.actor === state.capturedUnit) continue;
    const r = resolveAction(state, act);
    logs.push(...r);
    // Check end conditions mid-turn
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

  if (state.phase === "select") {
    const tickLogs = tickEnd(state);
    logs.push(...tickLogs);
    // Check post-tick end conditions
    if (aliveOf(state.allies).length === 0) {
      state.phase = "end_defeat";
      logs.push({ text: "敗北… パーティが全滅した。", kind: "defeat" });
    } else if (aliveOf(state.enemies).length === 0) {
      state.phase = "end_victory";
      logs.push({ text: "勝利！ 敵を全て倒した！", kind: "victory" });
    } else {
      state.turn += 1;
    }
  }

  state.log.push(...logs);
  return logs;
}
