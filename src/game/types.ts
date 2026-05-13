// Runtime / save data types
import type { Rarity, BaseStats } from "./data/characters";

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
  rarityDexSeen: Record<Rarity, number>; // how many of each rarity encountered
  charDexCaught: Record<string, boolean>; // charId -> caught (any stage)
  stats: {
    battlesWon: number;
    battlesLost: number;
    capturesAttempted: number;
    capturesSucceeded: number;
    totalPlayMinutes: number;
  };
}

export interface BattleUnit {
  refUid?: string;            // OwnedCharacter.uid if this is the player's char
  charId: string;
  side: "ally" | "enemy";
  name: string;
  level: number;
  stage: 1 | 2 | 3;
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  stats: BaseStats;           // effective stats after evolution multiplier
  skills: string[];
  element: import("./data/skills").Element;
  rarity: Rarity;
  statusEffects: Array<{ status: "burn" | "freeze" | "stun" | "poison"; turns: number }>;
  buffs: Array<{ stat: keyof BaseStats; delta: number; turns: number }>;
  isWild: boolean;            // wild enemy -> capturable
}
