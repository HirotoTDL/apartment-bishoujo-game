// =====================================================================
//  Character Role Assignment & Learnset Override
// =====================================================================
//  Centralises each character's combat role, ultimate skill, and the
//  skills they learn by level. Roles drive stat distribution, AI
//  decisions, and which actions the player can pick in battle.
// =====================================================================

import type { Role, SkillId, Element } from "./skills";

export interface RoleAssignment {
  role: Role;
  ultId: SkillId;
  passive?: {
    id: string;
    name: string;
    description: string;
  };
}

// Default skill list per role.
// Each role gets a baseline kit; element-specific attacks are layered in
// via ELEMENT_FLAVOR_SKILLS below.
function makeLearnset(role: Role, element: Element, ultId: SkillId): Array<{ lv: number; skill: SkillId }> {
  // Resolve a "primary attack" skill matching the element.
  const ELEMENT_ATTACK: Record<Element, SkillId> = {
    fire: "s_flame_lance",
    water: "s_aqua_pierce",
    wood: "s_thorn_whip",
    light: "s_radiant_blade",
    dark: "s_shadow_slash",
  };
  const ELEMENT_AOE: Record<Element, SkillId> = {
    fire: "s_inferno",
    water: "s_tsunami",
    wood: "s_thorn_storm",
    light: "s_holy_burst",
    dark: "s_void_pulse",
  };
  const primary = ELEMENT_ATTACK[element];
  const aoe = ELEMENT_AOE[element];

  const ult = { lv: 50, skill: ultId };

  switch (role) {
    case "tank":
      return [
        { lv: 1, skill: "s_strike" },
        { lv: 1, skill: "s_shield_bash" },
        { lv: 6, skill: "s_taunt" },
        { lv: 14, skill: "s_iron_wall" },
        { lv: 28, skill: primary },
        { lv: 42, skill: "s_guardian_aura" },
        ult,
      ];
    case "striker":
      return [
        { lv: 1, skill: "s_strike" },
        { lv: 1, skill: primary },
        { lv: 10, skill: "s_swift_strike" },
        { lv: 22, skill: "s_war_cry" },
        { lv: 38, skill: aoe },
        ult,
      ];
    case "mage":
      return [
        { lv: 1, skill: "s_strike" },
        { lv: 1, skill: primary },
        { lv: 8, skill: "s_focus" },
        { lv: 18, skill: aoe },
        { lv: 35, skill: primary },
        { lv: 45, skill: aoe },
        ult,
      ];
    case "healer":
      return [
        { lv: 1, skill: "s_strike" },
        { lv: 1, skill: "s_heal" },
        { lv: 10, skill: primary },
        { lv: 20, skill: "s_aqua_cure" },
        { lv: 30, skill: "s_group_heal" },
        { lv: 42, skill: "s_revive" },
        ult,
      ];
    case "buffer":
      return [
        { lv: 1, skill: "s_strike" },
        { lv: 1, skill: primary },
        { lv: 8, skill: "s_tempo_up" },
        { lv: 16, skill: "s_war_cry" },
        { lv: 28, skill: "s_focus" },
        { lv: 40, skill: "s_haste_charge" },
        ult,
      ];
    case "debuffer":
      return [
        { lv: 1, skill: "s_strike" },
        { lv: 1, skill: primary },
        { lv: 10, skill: "s_curse" },
        { lv: 18, skill: "s_break_armor" },
        { lv: 30, skill: "s_sleeping_song" },
        { lv: 42, skill: "s_blight" },
        ult,
      ];
  }
}

// =====================================================================
//  Per-character role & ult assignments
// =====================================================================

export const ROLE_ASSIGNMENTS: Record<string, RoleAssignment> = {
  // ===== UR =====
  ur_001: { role: "tank",     ultId: "s_ult_fortress" },   // グランエルディオン
  ur_002: { role: "debuffer", ultId: "s_ult_eclipse" },    // ノワール・サンクチュアリ

  // ===== SSR =====
  ssr_001: { role: "healer",  ultId: "s_ult_world_tree" }, // ハートフルゴリオン
  ssr_002: { role: "striker", ultId: "s_ult_phoenix" },    // ロイヤルベルサイユ
  ssr_003: { role: "striker", ultId: "s_ult_glacial" },    // ドラグーンクラウン
  ssr_004: { role: "buffer",  ultId: "s_ult_war_anthem" }, // セイントマグノリア

  // ===== SR =====
  sr_001: { role: "debuffer", ultId: "s_ult_phoenix" },    // コンテッサウーノ
  sr_002: { role: "striker",  ultId: "s_ult_phoenix" },    // フェローチェ
  sr_003: { role: "healer",   ultId: "s_ult_genesis" },    // アンジェリーク
  sr_004: { role: "mage",     ultId: "s_ult_abyss" },      // カランドリエ・ルナ
  sr_005: { role: "striker",  ultId: "s_ult_phoenix" },    // フェニックスメイデン

  // ===== R =====
  r_001: { role: "striker",  ultId: "s_ult_war_anthem" }, // フィフティーンラブ
  r_002: { role: "healer",   ultId: "s_ult_genesis" },    // エスポワール
  r_003: { role: "buffer",   ultId: "s_ult_war_anthem" }, // メゾン・カトレア
  r_004: { role: "mage",     ultId: "s_ult_phoenix" },    // ヴィラ・ソレイユ
  r_005: { role: "tank",     ultId: "s_ult_fortress" },   // パレロワイヤル
  r_006: { role: "buffer",   ultId: "s_ult_war_anthem" }, // ベルメゾン桜
  r_007: { role: "striker",  ultId: "s_ult_glacial" },    // グランブルー
  r_008: { role: "buffer",   ultId: "s_ult_genesis" },    // ピアチェーレ
  r_009: { role: "debuffer", ultId: "s_ult_eclipse" },    // カサノヴァ・ローザ
  r_010: { role: "buffer",   ultId: "s_ult_world_tree" }, // セレッソ咲耶
  r_011: { role: "mage",     ultId: "s_ult_glacial" },    // ハイツ・オーロラ
  r_012: { role: "healer",   ultId: "s_ult_world_tree" }, // フローラ・リアン
  r_013: { role: "mage",     ultId: "s_ult_glacial" },    // リヴェール・ノエル
  r_014: { role: "striker",  ultId: "s_ult_abyss" },      // カプリス
  r_015: { role: "debuffer", ultId: "s_ult_phoenix" },    // ミラージュ・ベル

  // ===== N =====
  n_001: { role: "healer",   ultId: "s_ult_genesis" },    // レジデンスめぐみ
  n_002: { role: "tank",     ultId: "s_ult_world_tree" }, // コーポマロニエ
  n_003: { role: "striker",  ultId: "s_ult_war_anthem" }, // ハイツみどり
  n_004: { role: "mage",     ultId: "s_ult_glacial" },    // メゾン青葉
  n_005: { role: "buffer",   ultId: "s_ult_war_anthem" }, // アパートさくら
  n_006: { role: "striker",  ultId: "s_ult_phoenix" },    // コーポさつき
  n_007: { role: "buffer",   ultId: "s_ult_genesis" },    // ハウスやまぶき
  n_008: { role: "tank",     ultId: "s_ult_fortress" },   // グリーンハイム
  n_009: { role: "striker",  ultId: "s_ult_phoenix" },    // サンライズ柚月
  n_010: { role: "buffer",   ultId: "s_ult_war_anthem" }, // パークヴィラ
  n_011: { role: "healer",   ultId: "s_ult_genesis" },    // メゾン・ド・カモミール
  n_012: { role: "mage",     ultId: "s_ult_phoenix" },    // コートシトラス
  n_013: { role: "healer",   ultId: "s_ult_glacial" },    // レジデンス紫陽花
  n_014: { role: "mage",     ultId: "s_ult_genesis" },    // スカイヒルズ星奈
  n_015: { role: "striker",  ultId: "s_ult_war_anthem" }, // ハイツ・ラ・パピヨン
  n_016: { role: "debuffer", ultId: "s_ult_glacial" },    // ヴィレッタ朝霧
  n_017: { role: "buffer",   ultId: "s_ult_genesis" },    // セジュール紗良
  n_018: { role: "healer",   ultId: "s_ult_world_tree" }, // カサデルフィオーレ
  n_019: { role: "tank",     ultId: "s_ult_glacial" },    // メゾン白菊
  n_020: { role: "debuffer", ultId: "s_ult_war_anthem" }, // ヴィラ・パセリ
  n_021: { role: "buffer",   ultId: "s_ult_genesis" },    // ハイツ・カナリア
  n_022: { role: "striker",  ultId: "s_ult_war_anthem" }, // コーポ若葉
  n_023: { role: "healer",   ultId: "s_ult_world_tree" }, // メゾン木蓮
  n_024: { role: "mage",     ultId: "s_ult_glacial" },    // パークサイド涼
};

// Convenience: get the per-character learnset, derived from role
export function getLearnsetFor(charId: string, element: Element): Array<{ lv: number; skill: SkillId }> {
  const a = ROLE_ASSIGNMENTS[charId];
  if (!a) return [{ lv: 1, skill: "s_strike" }];
  return makeLearnset(a.role, element, a.ultId);
}
