// Growth, leveling, evolution + battle unit construction
import type { CharacterMaster, BaseStats, Rarity } from "./data/characters";
import { CHARACTERS_BY_ID } from "./data/characters";
import { SKILLS } from "./data/skills";
import type { OwnedCharacter, BattleUnit } from "./types";

export function expForNextLevel(level: number, curve: CharacterMaster["growthCurve"]): number {
  const base = level * level * 12;
  const m = curve === "fast" ? 0.85 : curve === "slow" ? 1.3 : 1.0;
  return Math.floor(base * m);
}

function getStageMultiplier(master: CharacterMaster, stage: 1 | 2 | 3): number {
  const evo = master.evolutions.find(e => e.stage === stage);
  return evo?.statMultiplier ?? 1.0;
}

export function effectiveStats(master: CharacterMaster, level: number, stage: 1 | 2 | 3): BaseStats {
  const lvlMul = 1 + (level - 1) * 0.06;
  const evoMul = getStageMultiplier(master, stage);
  const s = master.baseStats;
  return {
    hp: Math.round(s.hp * lvlMul * evoMul),
    atk: Math.round(s.atk * lvlMul * evoMul),
    def: Math.round(s.def * lvlMul * evoMul),
    mag: Math.round(s.mag * lvlMul * evoMul),
    spd: Math.round(s.spd * lvlMul * evoMul),
  };
}

// Skills learnt at or before this level — excludes ult (acquired separately)
export function learnedSkills(master: CharacterMaster, level: number): string[] {
  const ultId = master.ultId ?? "s_strike";
  return master.skillLearnset
    .filter(l => l.lv <= level && l.skill !== ultId)
    .map(l => l.skill);
}

// Whether the unit has unlocked their ult skill
export function ultUnlocked(master: CharacterMaster, level: number): boolean {
  if (!master.ultId) return false;
  return master.skillLearnset.some(l => l.lv <= level && l.skill === master.ultId);
}

export function maxMP(magStat: number, level: number): number {
  return Math.floor(30 + magStat * 0.6 + level * 2);
}

// ---------------------------------------------------------------------
// Experience / level-up
// ---------------------------------------------------------------------
export interface GrowthEvent {
  type: "levelup" | "evolve" | "skill_learned";
  level?: number;
  newStage?: 1 | 2 | 3;
  skillId?: string;
}

export function applyExp(char: OwnedCharacter, expGain: number): GrowthEvent[] {
  const events: GrowthEvent[] = [];
  const master = CHARACTERS_BY_ID[char.charId];
  if (!master) return events;
  char.exp += expGain;
  while (char.level < 99) {
    const need = expForNextLevel(char.level, master.growthCurve);
    if (char.exp < need) break;
    char.exp -= need;
    char.level += 1;
    events.push({ type: "levelup", level: char.level });
    for (const ls of master.skillLearnset) {
      if (ls.lv === char.level) {
        events.push({ type: "skill_learned", skillId: ls.skill });
      }
    }
    for (const evo of master.evolutions) {
      if (char.level === evo.unlockLv && evo.stage > char.stage) {
        char.stage = evo.stage;
        events.push({ type: "evolve", newStage: evo.stage });
      }
    }
  }
  if (events.some(e => e.type === "levelup")) {
    const stats = effectiveStats(master, char.level, char.stage);
    char.hp = stats.hp;
    char.mp = maxMP(stats.mag, char.level);
  }
  return events;
}

// ---------------------------------------------------------------------
// Battle unit construction
// ---------------------------------------------------------------------

export function toBattleUnit(char: OwnedCharacter, side: "ally" | "enemy" = "ally"): BattleUnit {
  const master = CHARACTERS_BY_ID[char.charId]!;
  const stats = effectiveStats(master, char.level, char.stage);
  const skills = learnedSkills(master, char.level);
  return {
    refUid: char.uid,
    charId: char.charId,
    side,
    name: master.name,
    level: char.level,
    stage: char.stage,
    rarity: master.rarity,
    role: master.role ?? "striker",
    element: master.element,
    hp: Math.min(char.hp, stats.hp),
    hpMax: stats.hp,
    mp: Math.min(char.mp, maxMP(stats.mag, char.level)),
    mpMax: maxMP(stats.mag, char.level),
    stats,
    skills,
    ultId: master.ultId ?? "s_strike",
    statuses: [],
    ultGauge: 0,
    breakGauge: 0,
    broken: false,
    brokenTurnsRemaining: 0,
    cooldowns: {},
    isWild: false,
  };
}

export function makeWildUnit(charId: string, level: number): BattleUnit {
  const master = CHARACTERS_BY_ID[charId]!;
  let stage: 1 | 2 | 3 = 1;
  if (level >= 50) stage = 3;
  else if (level >= 25) stage = 2;
  const stats = effectiveStats(master, level, stage);
  const skills = learnedSkills(master, level);
  return {
    charId,
    side: "enemy",
    name: master.name,
    level,
    stage,
    rarity: master.rarity,
    role: master.role ?? "striker",
    element: master.element,
    hp: stats.hp,
    hpMax: stats.hp,
    mp: maxMP(stats.mag, level),
    mpMax: maxMP(stats.mag, level),
    stats,
    skills,
    ultId: master.ultId ?? "s_strike",
    statuses: [],
    ultGauge: ultUnlocked(master, level) ? 50 : 0, // enemies start with half-gauge if ult learned
    breakGauge: 0,
    broken: false,
    brokenTurnsRemaining: 0,
    cooldowns: {},
    isWild: true,
  };
}

let __ownedUidCounter = 0;
export function makeOwned(charId: string, level: number = 1, idPrefix = "own"): OwnedCharacter {
  __ownedUidCounter += 1;
  const master = CHARACTERS_BY_ID[charId]!;
  let stage: 1 | 2 | 3 = 1;
  if (level >= 50) stage = 3;
  else if (level >= 25) stage = 2;
  const stats = effectiveStats(master, level, stage);
  return {
    uid: `${idPrefix}_${Date.now()}_${__ownedUidCounter}_${Math.floor(Math.random() * 9999)}`,
    charId,
    level,
    exp: 0,
    hp: stats.hp,
    mp: maxMP(stats.mag, level),
    stage,
    caughtAt: Date.now(),
  };
}

export function expReward(enemy: BattleUnit): number {
  const rarityMul: Record<Rarity, number> = { N: 1.0, R: 1.4, SR: 2.0, SSR: 3.0, UR: 5.0 };
  return Math.floor((20 + enemy.level * 6) * rarityMul[enemy.rarity]);
}

export function availableSkills(unit: BattleUnit) {
  return unit.skills
    .map(id => SKILLS[id])
    .filter(Boolean)
    .map(s => ({
      ...s,
      usable: unit.mp >= s.mpCost && (unit.cooldowns[s.id] ?? 0) === 0,
    }));
}
