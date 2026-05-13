// =====================================================================
//  Skill & Combat Data — v2 (Strategic Combat)
// =====================================================================
//  Design pillars:
//   - Role-based identity: each character has a primary combat role
//   - Multi-effect skills: one skill can deal damage AND apply status
//   - Element weakness fills a Break gauge; broken enemies take +50%
//   - Ultimate skills require a charged gauge (built through action)
//   - Status effects: burn, freeze, poison, stun, silence, weaken,
//                      shield, regen, taunt
// =====================================================================

export type Element = "fire" | "water" | "wood" | "light" | "dark";

export type Role = "tank" | "striker" | "mage" | "healer" | "buffer" | "debuffer";

export const ROLE_LABEL: Record<Role, string> = {
  tank:     "盾衛",
  striker:  "撃殺",
  mage:     "術師",
  healer:   "癒手",
  buffer:   "支援",
  debuffer: "呪術",
};

export const ROLE_DESC: Record<Role, string> = {
  tank:     "高HP/防御。挑発・カバーで前衛を守る",
  striker:  "高ATK/SPD。単体に大ダメージを叩き出す",
  mage:     "高MAG。範囲攻撃と属性ブレイクが得意",
  healer:   "HP/MP回復、状態異常解除",
  buffer:   "味方のステータス上昇、行動順操作",
  debuffer: "敵に状態異常・能力低下を撒く",
};

// Stat distribution multiplier per role (applied to baseStats total)
export const ROLE_STAT_MUL: Record<Role, { hp: number; atk: number; def: number; mag: number; spd: number }> = {
  tank:     { hp: 1.55, atk: 0.80, def: 1.55, mag: 0.75, spd: 0.70 },
  striker:  { hp: 0.95, atk: 1.55, def: 0.90, mag: 0.75, spd: 1.35 },
  mage:     { hp: 0.85, atk: 0.70, def: 0.85, mag: 1.65, spd: 1.00 },
  healer:   { hp: 1.05, atk: 0.70, def: 1.05, mag: 1.45, spd: 1.05 },
  buffer:   { hp: 1.00, atk: 0.85, def: 1.00, mag: 1.25, spd: 1.20 },
  debuffer: { hp: 0.95, atk: 1.05, def: 0.95, mag: 1.35, spd: 1.20 },
};

export const ELEMENT_LABEL: Record<Element, string> = {
  fire: "火", water: "水", wood: "木", light: "光", dark: "闇",
};

// fire > wood > water > fire (cycle), light <> dark
export const ELEMENT_WEAK: Record<Element, Element> = {
  fire: "wood",   // fire deals 1.5x to wood
  wood: "water",
  water: "fire",
  light: "dark",
  dark: "light",
};
// fire is weak when receiving water (i.e., element X is hit by element Y => Y is weak target for X)
export const ELEMENT_RESIST: Record<Element, Element> = {
  fire: "water",  // fire takes 0.5x from water? actually: fire is weak to water
  water: "wood",
  wood: "fire",
  light: "light",
  dark: "dark",
};

// Returns 1.5 if attacker has advantage, 0.5 if defender resists, 1.0 otherwise
export function elementMul(attackerElem: Element, defenderElem: Element): number {
  if (ELEMENT_WEAK[attackerElem] === defenderElem) return 1.5;
  if (ELEMENT_WEAK[defenderElem] === attackerElem) return 0.6;
  return 1.0;
}

// =====================================================================
//  Status Effects
// =====================================================================

export type StatusId =
  | "burn"       // fire dot, 6% HP/turn for 3
  | "freeze"     // water control, 40% skip chance for 2
  | "poison"     // wood dot, 5% HP/turn for 4
  | "stun"       // light control, skip 1 turn
  | "silence"    // dark, no skills (only basic atk) for 2
  | "weaken"     // -25% atk for 3
  | "fragile"    // -25% def for 3
  | "slow"       // -25% spd for 3
  | "regen"      // +6% HP/turn for 3
  | "shield"     // absorbs N damage
  | "taunt"      // forces enemies to target this unit
  | "barrier";   // halves damage taken for 2 turns

export const STATUS_LABEL: Record<StatusId, string> = {
  burn: "やけど", freeze: "凍結", poison: "毒",
  stun: "スタン", silence: "沈黙",
  weaken: "攻撃↓", fragile: "防御↓", slow: "速度↓",
  regen: "再生", shield: "盾", taunt: "挑発", barrier: "障壁",
};

export const STATUS_KIND: Record<StatusId, "buff" | "debuff" | "neutral"> = {
  burn: "debuff", freeze: "debuff", poison: "debuff",
  stun: "debuff", silence: "debuff",
  weaken: "debuff", fragile: "debuff", slow: "debuff",
  regen: "buff", shield: "buff", taunt: "neutral", barrier: "buff",
};

// =====================================================================
//  Skill System
// =====================================================================

export type Target = "single_enemy" | "all_enemies" | "single_ally" | "all_allies" | "self" | "lowest_hp_ally" | "single_dead_ally";

export type SkillKind = "attack" | "heal" | "buff" | "debuff" | "support" | "ult";

export interface SkillEffect {
  type:
    | "damage"
    | "heal"
    | "shield"
    | "status"
    | "buff"
    | "debuff"
    | "cleanse"
    | "revive"
    | "taunt"
    | "ult_charge";
  // For damage/heal
  power?: number;          // base power
  // For status
  status?: StatusId;
  chance?: number;         // 0..1
  // Duration in turns
  turns?: number;
  // For buff/debuff stat changes
  stat?: "atk" | "def" | "spd" | "mag";
  pct?: number;            // +25 means +25%
  // For shield
  shieldAmount?: number;
  // For revive
  revivePct?: number;      // % of max HP
  // For ult charge
  ultGain?: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  element: Element;
  kind: SkillKind;
  mpCost: number;
  cooldown?: number;          // turns; 0 = none
  target: Target;
  effects: SkillEffect[];
  // True if requires full ULT gauge to use
  ultimate?: boolean;
}

// =====================================================================
//  Skill Library
// =====================================================================

export const SKILLS: Record<string, Skill> = {
  // ===== Basic Attack (everyone has) =====
  s_strike: {
    id: "s_strike",
    name: "アタック",
    description: "標準の単体攻撃。MPを溜める",
    element: "light",
    kind: "attack",
    mpCost: 0,
    target: "single_enemy",
    effects: [{ type: "damage", power: 30 }, { type: "ult_charge", ultGain: 10 }],
  },

  // ===== STRIKER skills =====
  s_swift_strike: {
    id: "s_swift_strike",
    name: "スイフトストライク",
    description: "高速で2回連撃する",
    element: "light",
    kind: "attack", mpCost: 12, target: "single_enemy",
    effects: [{ type: "damage", power: 32 }, { type: "damage", power: 32 }],
  },
  s_flame_lance: {
    id: "s_flame_lance",
    name: "フレイムランス",
    description: "炎の槍で貫く。やけど30%",
    element: "fire",
    kind: "attack", mpCost: 14, target: "single_enemy",
    effects: [{ type: "damage", power: 60 }, { type: "status", status: "burn", chance: 0.3, turns: 3 }],
  },
  s_aqua_pierce: {
    id: "s_aqua_pierce",
    name: "アクアピアス",
    description: "氷の刃で貫く。凍結25%",
    element: "water",
    kind: "attack", mpCost: 14, target: "single_enemy",
    effects: [{ type: "damage", power: 60 }, { type: "status", status: "freeze", chance: 0.25, turns: 2 }],
  },
  s_thorn_whip: {
    id: "s_thorn_whip",
    name: "ソーンウィップ",
    description: "棘の鞭で打つ。毒30%",
    element: "wood",
    kind: "attack", mpCost: 12, target: "single_enemy",
    effects: [{ type: "damage", power: 55 }, { type: "status", status: "poison", chance: 0.3, turns: 4 }],
  },
  s_radiant_blade: {
    id: "s_radiant_blade",
    name: "ラディアントブレイド",
    description: "光の剣閃。スタン20%",
    element: "light",
    kind: "attack", mpCost: 16, target: "single_enemy",
    effects: [{ type: "damage", power: 65 }, { type: "status", status: "stun", chance: 0.2, turns: 1 }],
  },
  s_shadow_slash: {
    id: "s_shadow_slash",
    name: "シャドウスラッシュ",
    description: "闇の一閃。沈黙30%",
    element: "dark",
    kind: "attack", mpCost: 14, target: "single_enemy",
    effects: [{ type: "damage", power: 58 }, { type: "status", status: "silence", chance: 0.3, turns: 2 }],
  },

  // ===== MAGE skills (AOE focus) =====
  s_inferno: {
    id: "s_inferno",
    name: "インフェルノ",
    description: "全体に火炎攻撃",
    element: "fire",
    kind: "attack", mpCost: 22, target: "all_enemies",
    effects: [{ type: "damage", power: 55 }],
  },
  s_tsunami: {
    id: "s_tsunami",
    name: "ツナミ",
    description: "全体に大波。凍結15%",
    element: "water",
    kind: "attack", mpCost: 22, target: "all_enemies",
    effects: [{ type: "damage", power: 55 }, { type: "status", status: "freeze", chance: 0.15, turns: 2 }],
  },
  s_thorn_storm: {
    id: "s_thorn_storm",
    name: "ソーンストーム",
    description: "全体に棘の嵐。毒20%",
    element: "wood",
    kind: "attack", mpCost: 22, target: "all_enemies",
    effects: [{ type: "damage", power: 50 }, { type: "status", status: "poison", chance: 0.2, turns: 3 }],
  },
  s_holy_burst: {
    id: "s_holy_burst",
    name: "ホーリーバースト",
    description: "全体に聖光。スタン10%",
    element: "light",
    kind: "attack", mpCost: 24, target: "all_enemies",
    effects: [{ type: "damage", power: 55 }, { type: "status", status: "stun", chance: 0.1, turns: 1 }],
  },
  s_void_pulse: {
    id: "s_void_pulse",
    name: "ヴォイドパルス",
    description: "全体に虚無。沈黙15%",
    element: "dark",
    kind: "attack", mpCost: 22, target: "all_enemies",
    effects: [{ type: "damage", power: 55 }, { type: "status", status: "silence", chance: 0.15, turns: 2 }],
  },

  // ===== HEALER skills (rebalanced — costs up, power down, cooldowns) =====
  s_heal: {
    id: "s_heal",
    name: "ヒール",
    description: "味方単体のHPを少し回復(クールダウン1T)",
    element: "light",
    kind: "heal", mpCost: 16, target: "single_ally",
    cooldown: 1,
    effects: [{ type: "heal", power: 55 }],
  },
  s_aqua_cure: {
    id: "s_aqua_cure",
    name: "アクアキュア",
    description: "味方単体を中回復+デバフ解除(クールダウン2T)",
    element: "water",
    kind: "heal", mpCost: 26, target: "single_ally",
    cooldown: 2,
    effects: [{ type: "heal", power: 90 }, { type: "cleanse" }],
  },
  s_group_heal: {
    id: "s_group_heal",
    name: "グループヒール",
    description: "味方全体のHPをわずかに回復(クールダウン2T)",
    element: "light",
    kind: "heal", mpCost: 30, target: "all_allies",
    cooldown: 2,
    effects: [{ type: "heal", power: 35 }],
  },
  s_regen_song: {
    id: "s_regen_song",
    name: "リジェネレートソング",
    description: "味方全体に再生(3ターンHP回復)",
    element: "wood",
    kind: "heal", mpCost: 24, target: "all_allies",
    effects: [{ type: "status", status: "regen", chance: 1, turns: 3 }],
  },
  s_world_tree: {
    id: "s_world_tree",
    name: "世界樹の祝福",
    description: "味方全体を中回復+再生(クールダウン3T)",
    element: "wood",
    kind: "heal", mpCost: 40, target: "all_allies",
    cooldown: 3,
    effects: [{ type: "heal", power: 60 }, { type: "status", status: "regen", chance: 1, turns: 3 }],
  },
  s_revive: {
    id: "s_revive",
    name: "リバイブ",
    description: "倒れた味方を40%HPで蘇生(クールダウン3T)",
    element: "light",
    kind: "heal", mpCost: 36, target: "single_dead_ally",
    cooldown: 3,
    effects: [{ type: "revive", revivePct: 40 }],
  },

  // ===== TANK skills =====
  s_taunt: {
    id: "s_taunt",
    name: "挑発",
    description: "敵全体の標的を自分に集める(2ターン)",
    element: "light",
    kind: "support", mpCost: 8, target: "self",
    effects: [{ type: "taunt", turns: 2 }],
  },
  s_iron_wall: {
    id: "s_iron_wall",
    name: "アイアンウォール",
    description: "自身に巨大シールド(2ターン)",
    element: "light",
    kind: "support", mpCost: 12, target: "self",
    effects: [{ type: "shield", shieldAmount: 300, turns: 2 }],
  },
  s_shield_bash: {
    id: "s_shield_bash",
    name: "シールドバッシュ",
    description: "盾で殴る。スタン40%",
    element: "light",
    kind: "attack", mpCost: 10, target: "single_enemy",
    effects: [{ type: "damage", power: 40 }, { type: "status", status: "stun", chance: 0.4, turns: 1 }],
  },
  s_guardian_aura: {
    id: "s_guardian_aura",
    name: "ガーディアンオーラ",
    description: "味方全体に障壁(被ダメ50%減・2ターン)",
    element: "light",
    kind: "support", mpCost: 22, target: "all_allies",
    effects: [{ type: "status", status: "barrier", chance: 1, turns: 2 }],
  },

  // ===== BUFFER skills =====
  s_war_cry: {
    id: "s_war_cry",
    name: "ウォークライ",
    description: "味方全体の攻撃を3ターン+30%",
    element: "fire",
    kind: "buff", mpCost: 16, target: "all_allies",
    effects: [{ type: "buff", stat: "atk", pct: 30, turns: 3 }],
  },
  s_tempo_up: {
    id: "s_tempo_up",
    name: "テンポアップ",
    description: "味方全体の素早さを3ターン+25%",
    element: "wood",
    kind: "buff", mpCost: 14, target: "all_allies",
    effects: [{ type: "buff", stat: "spd", pct: 25, turns: 3 }],
  },
  s_focus: {
    id: "s_focus",
    name: "フォーカス",
    description: "味方単体に魔力+50%、3ターン",
    element: "light",
    kind: "buff", mpCost: 12, target: "single_ally",
    effects: [{ type: "buff", stat: "mag", pct: 50, turns: 3 }],
  },
  s_haste_charge: {
    id: "s_haste_charge",
    name: "ヘイストチャージ",
    description: "味方全体にUlt充填+25",
    element: "light",
    kind: "support", mpCost: 18, target: "all_allies",
    effects: [{ type: "ult_charge", ultGain: 25 }],
  },

  // ===== DEBUFFER skills =====
  s_curse: {
    id: "s_curse",
    name: "カース",
    description: "敵単体に攻撃-30%、3ターン",
    element: "dark",
    kind: "debuff", mpCost: 12, target: "single_enemy",
    effects: [{ type: "debuff", stat: "atk", pct: -30, turns: 3 }],
  },
  s_break_armor: {
    id: "s_break_armor",
    name: "ブレイクアーマー",
    description: "敵単体に防御-35%、3ターン",
    element: "dark",
    kind: "debuff", mpCost: 12, target: "single_enemy",
    effects: [{ type: "debuff", stat: "def", pct: -35, turns: 3 }],
  },
  s_sleeping_song: {
    id: "s_sleeping_song",
    name: "眠りの唄",
    description: "敵全体を確率スタン",
    element: "dark",
    kind: "debuff", mpCost: 18, target: "all_enemies",
    effects: [{ type: "status", status: "stun", chance: 0.45, turns: 1 }],
  },
  s_freezing_mist: {
    id: "s_freezing_mist",
    name: "凍霧",
    description: "敵全体に凍結確率+速度低下",
    element: "water",
    kind: "debuff", mpCost: 18, target: "all_enemies",
    effects: [{ type: "status", status: "freeze", chance: 0.4, turns: 2 }, { type: "debuff", stat: "spd", pct: -25, turns: 3 }],
  },
  s_blight: {
    id: "s_blight",
    name: "ブライト",
    description: "敵全体に毒",
    element: "wood",
    kind: "debuff", mpCost: 14, target: "all_enemies",
    effects: [{ type: "status", status: "poison", chance: 0.7, turns: 4 }],
  },

  // ===== ULTIMATE skills (require full ULT gauge) =====
  s_ult_phoenix: {
    id: "s_ult_phoenix",
    name: "★ フェニックスダイブ",
    description: "★必殺技 単体に超ダメージ+やけど確定",
    element: "fire",
    kind: "ult", mpCost: 0, target: "single_enemy", ultimate: true,
    effects: [{ type: "damage", power: 220 }, { type: "status", status: "burn", chance: 1, turns: 3 }],
  },
  s_ult_glacial: {
    id: "s_ult_glacial",
    name: "★ グレイシャルクラウン",
    description: "★必殺技 全体に強力な氷攻撃+凍結",
    element: "water",
    kind: "ult", mpCost: 0, target: "all_enemies", ultimate: true,
    effects: [{ type: "damage", power: 140 }, { type: "status", status: "freeze", chance: 0.7, turns: 2 }],
  },
  s_ult_world_tree: {
    id: "s_ult_world_tree",
    name: "★ 世界樹召喚",
    description: "★必殺技 全員HP全回復+再生",
    element: "wood",
    kind: "ult", mpCost: 0, target: "all_allies", ultimate: true,
    effects: [{ type: "heal", power: 9999 }, { type: "status", status: "regen", chance: 1, turns: 5 }, { type: "cleanse" }],
  },
  s_ult_judgement: {
    id: "s_ult_judgement",
    name: "★ ジャッジメント",
    description: "★必殺技 単体に絶大ダメージ",
    element: "light",
    kind: "ult", mpCost: 0, target: "single_enemy", ultimate: true,
    effects: [{ type: "damage", power: 280 }],
  },
  s_ult_abyss: {
    id: "s_ult_abyss",
    name: "★ アビスコール",
    description: "★必殺技 全体に闇+沈黙",
    element: "dark",
    kind: "ult", mpCost: 0, target: "all_enemies", ultimate: true,
    effects: [{ type: "damage", power: 130 }, { type: "status", status: "silence", chance: 0.8, turns: 3 }],
  },
  s_ult_genesis: {
    id: "s_ult_genesis",
    name: "★ ジェネシス",
    description: "★必殺技 全体に光+味方を全回復",
    element: "light",
    kind: "ult", mpCost: 0, target: "all_enemies", ultimate: true,
    effects: [{ type: "damage", power: 130 }],
  },
  s_ult_apocalypse: {
    id: "s_ult_apocalypse",
    name: "★ アポカリプス",
    description: "★必殺技 全体に最大級の闇",
    element: "dark",
    kind: "ult", mpCost: 0, target: "all_enemies", ultimate: true,
    effects: [{ type: "damage", power: 180 }],
  },
  s_ult_war_anthem: {
    id: "s_ult_war_anthem",
    name: "★ 戦の聖歌",
    description: "★必殺技 味方全体に攻撃+速度+50%(3ターン)+Ult充填",
    element: "fire",
    kind: "ult", mpCost: 0, target: "all_allies", ultimate: true,
    effects: [
      { type: "buff", stat: "atk", pct: 50, turns: 3 },
      { type: "buff", stat: "spd", pct: 50, turns: 3 },
      { type: "ult_charge", ultGain: 30 },
    ],
  },
  s_ult_fortress: {
    id: "s_ult_fortress",
    name: "★ アンブレイカブル",
    description: "★必殺技 味方全体に巨大シールド+挑発自身",
    element: "light",
    kind: "ult", mpCost: 0, target: "all_allies", ultimate: true,
    effects: [
      { type: "shield", shieldAmount: 500, turns: 3 },
      { type: "status", status: "barrier", chance: 1, turns: 3 },
    ],
  },
  s_ult_eclipse: {
    id: "s_ult_eclipse",
    name: "★ エクリプス",
    description: "★必殺技 敵全体に攻撃-50%/防御-50%(3T)+暗黒ダメージ",
    element: "dark",
    kind: "ult", mpCost: 0, target: "all_enemies", ultimate: true,
    effects: [
      { type: "damage", power: 70 },
      { type: "debuff", stat: "atk", pct: -50, turns: 3 },
      { type: "debuff", stat: "def", pct: -50, turns: 3 },
    ],
  },
};

export type SkillId = keyof typeof SKILLS;

// Default skill for basic attack fallback
export const BASIC_ATTACK_ID = "s_strike";
