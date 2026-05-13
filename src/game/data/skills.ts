// Skill master data
export type Element = "fire" | "water" | "wood" | "light" | "dark";
export type SkillKind = "attack" | "buff" | "debuff" | "heal";

export interface Skill {
  id: string;
  name: string;
  description: string;
  kind: SkillKind;
  element: Element;
  power: number;       // attack/heal base power (0 if buff/debuff)
  mpCost: number;
  target: "single" | "all" | "self";
  // Optional effects for non-attack skills
  effect?: {
    stat?: "atk" | "def" | "spd" | "mag";
    delta?: number;       // +/- amount
    duration?: number;    // turns
    statusChance?: number; // 0..1
    status?: "burn" | "freeze" | "stun" | "poison";
  };
}

export const ELEMENT_ADVANTAGE: Record<Element, Element> = {
  fire: "wood",   // 火 > 木
  wood: "water",  // 木 > 水
  water: "fire",  // 水 > 火
  light: "dark",  // 光 > 闇
  dark: "light",  // 闇 > 光
};

export const ELEMENT_LABEL: Record<Element, string> = {
  fire: "火",
  water: "水",
  wood: "木",
  light: "光",
  dark: "闇",
};

export const SKILLS: Record<string, Skill> = {
  // === BASIC ATTACKS (1 per element) ===
  s_strike: { id: "s_strike", name: "アタック", description: "通常攻撃", kind: "attack", element: "light", power: 30, mpCost: 0, target: "single" },
  s_fireball: { id: "s_fireball", name: "ファイアボール", description: "火の球で攻撃", kind: "attack", element: "fire", power: 45, mpCost: 8, target: "single" },
  s_aqua_lance: { id: "s_aqua_lance", name: "アクアランス", description: "水の槍で貫く", kind: "attack", element: "water", power: 45, mpCost: 8, target: "single" },
  s_vine_whip: { id: "s_vine_whip", name: "ヴァインウィップ", description: "蔦で打つ", kind: "attack", element: "wood", power: 45, mpCost: 8, target: "single" },
  s_light_arrow: { id: "s_light_arrow", name: "ライトアロー", description: "光の矢", kind: "attack", element: "light", power: 45, mpCost: 8, target: "single" },
  s_shadow_bolt: { id: "s_shadow_bolt", name: "シャドウボルト", description: "闇の弾丸", kind: "attack", element: "dark", power: 45, mpCost: 8, target: "single" },

  // === MID TIER ATTACKS ===
  s_inferno: { id: "s_inferno", name: "インフェルノ", description: "全体に火炎", kind: "attack", element: "fire", power: 55, mpCost: 18, target: "all" },
  s_tsunami: { id: "s_tsunami", name: "ツナミ", description: "全体に大波", kind: "attack", element: "water", power: 55, mpCost: 18, target: "all" },
  s_thorn_storm: { id: "s_thorn_storm", name: "ソーンストーム", description: "全体に棘の嵐", kind: "attack", element: "wood", power: 55, mpCost: 18, target: "all" },
  s_holy_burst: { id: "s_holy_burst", name: "ホーリーバースト", description: "全体に聖光", kind: "attack", element: "light", power: 55, mpCost: 18, target: "all" },
  s_void_pulse: { id: "s_void_pulse", name: "ヴォイドパルス", description: "全体に虚無", kind: "attack", element: "dark", power: 55, mpCost: 18, target: "all" },

  // === HIGH TIER (SR以上の専用技) ===
  s_phoenix_dive: { id: "s_phoenix_dive", name: "フェニックスダイブ", description: "不死鳥の急降下", kind: "attack", element: "fire", power: 90, mpCost: 30, target: "single" },
  s_glacial_song: { id: "s_glacial_song", name: "氷河の歌", description: "氷結+確率凍結", kind: "attack", element: "water", power: 70, mpCost: 25, target: "single", effect: { statusChance: 0.4, status: "freeze" } },
  s_world_tree: { id: "s_world_tree", name: "ワールドツリー", description: "世界樹の祝福", kind: "heal", element: "wood", power: 100, mpCost: 25, target: "all" },
  s_judgement: { id: "s_judgement", name: "ジャッジメント", description: "聖なる裁き", kind: "attack", element: "light", power: 110, mpCost: 35, target: "single" },
  s_abyss_call: { id: "s_abyss_call", name: "深淵の呼び声", description: "闇の混沌", kind: "attack", element: "dark", power: 110, mpCost: 35, target: "single" },

  // === BUFFS / DEBUFFS ===
  s_war_cry: { id: "s_war_cry", name: "ウォークライ", description: "味方全体の攻撃UP", kind: "buff", element: "fire", power: 0, mpCost: 12, target: "all", effect: { stat: "atk", delta: 15, duration: 3 } },
  s_shield_wall: { id: "s_shield_wall", name: "シールドウォール", description: "味方全体の防御UP", kind: "buff", element: "light", power: 0, mpCost: 12, target: "all", effect: { stat: "def", delta: 15, duration: 3 } },
  s_sleeping_song: { id: "s_sleeping_song", name: "眠りの唄", description: "敵全体を確率スタン", kind: "debuff", element: "dark", power: 0, mpCost: 15, target: "all", effect: { statusChance: 0.5, status: "stun" } },
  s_tempo_up: { id: "s_tempo_up", name: "テンポアップ", description: "味方全体の素早さUP", kind: "buff", element: "wood", power: 0, mpCost: 10, target: "all", effect: { stat: "spd", delta: 10, duration: 3 } },

  // === HEAL ===
  s_minor_heal: { id: "s_minor_heal", name: "ヒール", description: "味方単体を回復", kind: "heal", element: "light", power: 60, mpCost: 8, target: "single" },
  s_group_heal: { id: "s_group_heal", name: "グループヒール", description: "味方全体を回復", kind: "heal", element: "light", power: 50, mpCost: 18, target: "all" },
  s_aqua_cure: { id: "s_aqua_cure", name: "アクアキュア", description: "水の癒し", kind: "heal", element: "water", power: 80, mpCost: 14, target: "single" },

  // === UR SIGNATURE ===
  s_apocalypse: { id: "s_apocalypse", name: "アポカリプス", description: "破滅の極光", kind: "attack", element: "dark", power: 160, mpCost: 60, target: "all" },
  s_genesis: { id: "s_genesis", name: "ジェネシス", description: "創世の光", kind: "attack", element: "light", power: 160, mpCost: 60, target: "all" },
};

export type SkillId = keyof typeof SKILLS;
