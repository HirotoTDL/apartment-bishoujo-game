// Runtime / save data types
import type { Rarity, BaseStats } from "./data/characters";
import type { Element, StatusId, Role } from "./data/skills";

export interface OwnedCharacter {
  uid: string;              // unique within save (uuid)
  charId: string;           // master id (e.g. "n_001")
  level: number;            // 1..99
  exp: number;              // exp accumulated within current level
  hp: number;               // current HP
  mp: number;               // current MP
  stage: 1 | 2 | 3;         // evolution stage
  caughtAt: number;         // unix ms
  nickname?: string;
}

export interface PlayerSave {
  schemaVersion: 1;
  uid: string;               // firebase auth uid
  displayName: string;
  createdAt: number;
  lastPlayedAt: number;
  party: string[];           // OwnedCharacter.uid (length 1..4)
  owned: OwnedCharacter[];
  clearedStages: string[];   // stage ids
  unlockedStages: string[];  // stage ids
  items: Record<string, number>; // itemId -> count
  currency: { gold: number; gems: number };
  rarityDexSeen: Record<Rarity, number>;
  charDexCaught: Record<string, boolean>;
  stats: {
    battlesWon: number;
    battlesLost: number;
    capturesAttempted: number;
    capturesSucceeded: number;
    totalPlayMinutes: number;
  };
}

export interface ActiveStatus {
  status: StatusId;
  turns: number;
  // For stat-modifying statuses (weaken, fragile, slow, etc.)
  stat?: "atk" | "def" | "spd" | "mag";
  pct?: number;
  // For shield: HP it absorbs
  shieldHp?: number;
}

export interface BattleUnit {
  // Identity
  refUid?: string;            // OwnedCharacter.uid if player's char
  charId: string;
  side: "ally" | "enemy";
  name: string;
  level: number;
  stage: 1 | 2 | 3;
  rarity: Rarity;
  role: Role;
  element: Element;
  // Combat state
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  stats: BaseStats;           // effective stats incl. evolution multiplier
  // Skill kit
  skills: string[];           // learned skill ids (non-ult)
  ultId: string;              // ultimate skill id
  // Statuses + buffs + ult gauge + break
  statuses: ActiveStatus[];
  ultGauge: number;           // 0..100; 100 = ult ready
  breakGauge: number;         // 0..100; 100 = broken next turn
  broken: boolean;            // currently broken (acts skipped, +50% dmg taken)
  brokenTurnsRemaining: number;
  // Skill cooldowns
  cooldowns: Record<string, number>;  // skill id -> remaining turns
  // Meta
  isWild: boolean;            // wild enemy → capturable
}

// A planned action for a single unit this turn
export interface PlannedAction {
  actor: BattleUnit;
  kind: "skill" | "capture" | "item" | "defend";
  skillId?: string;
  targetUnits?: BattleUnit[];   // resolved targets (single or many)
  itemId?: string;
}
