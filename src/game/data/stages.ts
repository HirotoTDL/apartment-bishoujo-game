// =====================================================================
//  Stage / Chapter Master Data — v2 Balanced Distribution
// =====================================================================
//  Design pillars:
//    - Each chapter has a CLEAR rarity profile (Ch1 = N pool, Ch5 = UR)
//    - Bosses are named, themed signature characters at the chapter
//      climax. UR characters appear ONLY as final bosses (cannot roll
//      from random encounters).
//    - Levels scale smoothly: Ch1 [1-9] -> Ch2 [8-22] -> Ch3 [18-32]
//      -> Ch4 [28-42] -> Ch5 [42-60]. Bosses ~1.4x stage average level.
//    - Every character is reachable somewhere across the campaign.
// =====================================================================

import type { Rarity } from "./characters";

export interface StageEncounter {
  charId: string;
  weight: number;       // relative spawn weight (higher = more likely)
  minLv: number;
  maxLv: number;
}

export interface Stage {
  id: string;
  chapter: number;
  index: number;
  name: string;
  description: string;
  unlockAfter?: string;
  battlesToClear: number;
  bossCharId?: string;
  bossLv?: number;
  encounters: StageEncounter[];
  rewards: {
    gold: number;
    expBonus: number;
    items?: Array<{ itemId: string; qty: number }>;
  };
  rarityCap?: Rarity;
  // New metadata for UI hints
  recommendedPartyLv?: number;
}

const e = (charId: string, weight: number, minLv: number, maxLv: number): StageEncounter => ({ charId, weight, minLv, maxLv });

// =====================================================================
//  CHAPTER 1: 序章「あなたの新しい住処」 — Lv 1-9, all N rarity
// =====================================================================
//  Goal: collect ~half the N pool, learn battle mechanics.
//  Boss rarity: N
const C1: Stage[] = [
  {
    id: "1-1", chapter: 1, index: 1,
    name: "築浅レジデンス前",
    description: "あなたが越してきたばかりの『レジデンスめぐみ』前。住人たちが歓迎にやって来る。",
    battlesToClear: 3,
    bossCharId: "n_001", bossLv: 4,
    encounters: [
      e("n_001", 25, 1, 3),
      e("n_002", 25, 1, 3),
      e("n_003", 25, 1, 3),
      e("n_005", 25, 1, 3),
    ],
    rewards: { gold: 120, expBonus: 60 },
    rarityCap: "N",
    recommendedPartyLv: 2,
  },
  {
    id: "1-2", chapter: 1, index: 2,
    name: "メゾン坂下通り",
    description: "古き良きメゾンが立ち並ぶ通り。",
    unlockAfter: "1-1",
    battlesToClear: 3,
    encounters: [
      e("n_004", 25, 2, 4),
      e("n_006", 25, 2, 4),
      e("n_011", 25, 2, 4),
      e("n_018", 25, 2, 4),
    ],
    rewards: { gold: 180, expBonus: 80 },
    rarityCap: "N",
    recommendedPartyLv: 4,
  },
  {
    id: "1-3", chapter: 1, index: 3,
    name: "コーポさくら並木",
    description: "桜並木の参道沿い。春先に多くの住人が集まる。",
    unlockAfter: "1-2",
    battlesToClear: 3,
    bossCharId: "n_005", bossLv: 7,
    encounters: [
      e("n_005", 25, 3, 5),
      e("n_007", 25, 3, 5),
      e("n_023", 30, 3, 5),
      e("n_022", 20, 3, 5),
    ],
    rewards: { gold: 250, expBonus: 120 },
    rarityCap: "N",
    recommendedPartyLv: 6,
  },
  {
    id: "1-4", chapter: 1, index: 4,
    name: "ハイツ風の丘",
    description: "高台のハイツ群。風が強い。",
    unlockAfter: "1-3",
    battlesToClear: 4,
    encounters: [
      e("n_003", 20, 4, 6),
      e("n_009", 25, 4, 6),
      e("n_015", 25, 4, 6),
      e("n_021", 30, 4, 6),
    ],
    rewards: { gold: 320, expBonus: 160 },
    rarityCap: "N",
    recommendedPartyLv: 7,
  },
  {
    id: "1-5", chapter: 1, index: 5,
    name: "ヴィラ通り終端",
    description: "ヴィラとパークが入り交じる通りの終わり。次章への入口。",
    unlockAfter: "1-4",
    battlesToClear: 5,
    bossCharId: "n_010", bossLv: 12,
    encounters: [
      e("n_010", 22, 6, 9),
      e("n_014", 18, 6, 9),  // スカイヒルズ星奈
      e("n_017", 18, 6, 9),
      e("n_020", 17, 6, 9),
      e("n_024", 13, 6, 9),
      e("n_008", 12, 6, 9),  // tank class, slightly rarer
    ],
    rewards: { gold: 500, expBonus: 260 },
    rarityCap: "N",
    recommendedPartyLv: 9,
  },
];

// =====================================================================
//  CHAPTER 2: 「R級住宅地」 — Lv 8-22, primarily R with N support
// =====================================================================
const C2: Stage[] = [
  {
    id: "2-1", chapter: 2, index: 1,
    name: "ベルメゾン桜並木",
    description: "中堅住宅地、桜の名所。",
    unlockAfter: "1-5",
    battlesToClear: 4,
    encounters: [
      e("r_001", 18, 8, 12),  // フィフティーンラブ
      e("r_002", 18, 8, 12),  // エスポワール
      e("r_006", 20, 8, 12),  // ベルメゾン桜
      e("r_010", 18, 8, 12),  // セレッソ咲耶
      e("n_005", 13, 8, 11),
      e("n_023", 13, 8, 11),
    ],
    rewards: { gold: 600, expBonus: 320 },
    rarityCap: "R",
    recommendedPartyLv: 11,
  },
  {
    id: "2-2", chapter: 2, index: 2,
    name: "海岸沿いグランブルー",
    description: "海に面した区画。水属性が多数。",
    unlockAfter: "2-1",
    battlesToClear: 4,
    encounters: [
      e("r_007", 22, 10, 14),  // グランブルー
      e("r_011", 20, 10, 14),  // ハイツオーロラ
      e("r_013", 18, 10, 14),  // リヴェールノエル
      e("n_004", 15, 10, 13),
      e("n_019", 15, 10, 13),
      e("n_013", 10, 10, 13),
    ],
    rewards: { gold: 720, expBonus: 380 },
    rarityCap: "R",
    recommendedPartyLv: 13,
  },
  {
    id: "2-3", chapter: 2, index: 3,
    name: "ロイヤルガーデン",
    description: "高級志向のフローラ区画。",
    unlockAfter: "2-2",
    battlesToClear: 4,
    encounters: [
      e("r_003", 22, 12, 16),  // メゾンカトレア
      e("r_005", 20, 12, 16),  // パレロワイヤル
      e("r_008", 18, 12, 16),  // ピアチェーレ
      e("r_012", 20, 12, 16),  // フローラリアン
      e("n_018", 12, 12, 15),
      e("n_011", 8, 12, 15),
    ],
    rewards: { gold: 850, expBonus: 460 },
    rarityCap: "R",
    recommendedPartyLv: 15,
  },
  {
    id: "2-4", chapter: 2, index: 4,
    name: "情熱ヴィラ",
    description: "南国的なエリア。Ch2のボスが待ち構える。",
    unlockAfter: "2-3",
    battlesToClear: 5,
    bossCharId: "r_004", bossLv: 22,  // ヴィラ・ソレイユ
    encounters: [
      e("r_004", 22, 14, 18),
      e("r_009", 22, 14, 18),  // カサノヴァローザ
      e("r_014", 18, 14, 18),  // カプリス
      e("r_015", 18, 14, 18),  // ミラージュベル
      e("n_006", 10, 14, 17),
      e("n_009", 10, 14, 17),
    ],
    rewards: { gold: 1200, expBonus: 640 },
    rarityCap: "R",
    recommendedPartyLv: 18,
  },
];

// =====================================================================
//  CHAPTER 3: 「SR領域」 — Lv 18-32, SR-heavy with R support
// =====================================================================
const C3: Stage[] = [
  {
    id: "3-1", chapter: 3, index: 1,
    name: "コンテッサ通り",
    description: "高級住宅地。貴族令嬢たちが闊歩する。",
    unlockAfter: "2-4",
    battlesToClear: 5,
    encounters: [
      e("sr_001", 15, 18, 22),  // コンテッサウーノ
      e("sr_002", 13, 18, 22),  // フェローチェ
      e("sr_005", 10, 18, 22),  // フェニックスメイデン (rare)
      e("r_001", 20, 18, 22),
      e("r_009", 20, 18, 22),
      e("r_004", 22, 18, 22),
    ],
    rewards: { gold: 1600, expBonus: 850 },
    rarityCap: "SR",
    recommendedPartyLv: 22,
  },
  {
    id: "3-2", chapter: 3, index: 2,
    name: "天使のメゾン",
    description: "天使のような少女たちが集う。",
    unlockAfter: "3-1",
    battlesToClear: 5,
    encounters: [
      e("sr_003", 16, 20, 26),  // アンジェリーク
      e("sr_005", 12, 20, 26),  // フェニックスメイデン
      e("r_002", 22, 20, 26),
      e("r_005", 22, 20, 26),
      e("r_008", 18, 20, 26),
      e("n_011", 10, 20, 25),
    ],
    rewards: { gold: 1900, expBonus: 1000 },
    rarityCap: "SR",
    recommendedPartyLv: 25,
  },
  {
    id: "3-3", chapter: 3, index: 3,
    name: "月夜のサンクチュアリ",
    description: "魔女や占星術師の住む夜の街。中ボスが2体現れる。",
    unlockAfter: "3-2",
    battlesToClear: 6,
    bossCharId: "sr_004", bossLv: 32,  // カランドリエ・ルナ
    encounters: [
      e("sr_004", 20, 22, 30),
      e("sr_001", 14, 22, 30),
      e("r_014", 22, 22, 30),
      e("r_015", 20, 22, 30),
      e("r_009", 14, 22, 30),
      e("n_016", 10, 22, 28),  // ヴィレッタ朝霧
    ],
    rewards: { gold: 2500, expBonus: 1300 },
    rarityCap: "SR",
    recommendedPartyLv: 30,
  },
];

// =====================================================================
//  CHAPTER 4: 「SSR名邸」 — Lv 28-42, SSR encounters become possible
// =====================================================================
const C4: Stage[] = [
  {
    id: "4-1", chapter: 4, index: 1,
    name: "ハートフルパレス",
    description: "心優しき守護者の宮殿。",
    unlockAfter: "3-3",
    battlesToClear: 5,
    bossCharId: "ssr_001", bossLv: 38,  // ハートフルゴリオン
    encounters: [
      e("ssr_001", 8, 28, 35),   // boss appears as rare encounter too
      e("ssr_004", 7, 28, 35),   // セイントマグノリア (rare)
      e("sr_001", 18, 28, 35),
      e("sr_003", 18, 28, 35),
      e("r_005", 22, 28, 33),
      e("r_002", 22, 28, 33),
      e("n_023", 5, 28, 33),  // very rare common
    ],
    rewards: { gold: 3200, expBonus: 1700 },
    rarityCap: "SSR",
    recommendedPartyLv: 35,
  },
  {
    id: "4-2", chapter: 4, index: 2,
    name: "ロイヤルベルサイユ宮",
    description: "華麗なる王侯貴族の館。Ch4のボスが待つ。",
    unlockAfter: "4-1",
    battlesToClear: 6,
    bossCharId: "ssr_002", bossLv: 45,  // ロイヤルベルサイユ
    encounters: [
      e("ssr_002", 7, 32, 38),
      e("ssr_003", 7, 32, 38),    // ドラグーンクラウン (rare)
      e("ssr_004", 6, 32, 38),
      e("sr_002", 22, 32, 38),
      e("sr_005", 18, 32, 38),
      e("r_009", 18, 32, 38),
      e("r_004", 16, 32, 38),
      e("n_012", 6, 32, 37),
    ],
    rewards: { gold: 4500, expBonus: 2400 },
    rarityCap: "SSR",
    recommendedPartyLv: 42,
  },
];

// =====================================================================
//  CHAPTER 5: 「終章 UR聖域」 — Lv 42-60, UR bosses
// =====================================================================
//  UR characters are EXCLUSIVE to boss encounters in this chapter.
//  Random encounter pool includes SSR/SR but NOT UR.
const C5: Stage[] = [
  {
    id: "5-1", chapter: 5, index: 1,
    name: "グランエルディオン聖殿",
    description: "創世の光に至る最高位レジデンス。",
    unlockAfter: "4-2",
    battlesToClear: 7,
    bossCharId: "ur_001", bossLv: 55,  // グランエルディオン
    encounters: [
      e("ssr_001", 15, 42, 50),
      e("ssr_002", 15, 42, 50),
      e("ssr_004", 15, 42, 50),
      e("sr_003", 22, 42, 50),
      e("sr_001", 18, 42, 50),
      e("r_002", 15, 42, 48),
      // No UR in random pool — only boss
    ],
    rewards: { gold: 6500, expBonus: 3500 },
    rarityCap: "SSR",  // random encounters capped at SSR; UR is boss-only
    recommendedPartyLv: 52,
  },
  {
    id: "5-2", chapter: 5, index: 2,
    name: "ノワール・サンクチュアリ深層",
    description: "深淵の女王が君臨する闇の聖域。",
    unlockAfter: "5-1",
    battlesToClear: 8,
    bossCharId: "ur_002", bossLv: 65,  // ノワール・サンクチュアリ
    encounters: [
      e("ssr_002", 16, 50, 60),
      e("ssr_003", 16, 50, 60),
      e("sr_004", 20, 50, 60),
      e("sr_001", 18, 50, 60),
      e("r_014", 15, 50, 60),
      e("ssr_004", 15, 50, 60),
      // No UR — boss exclusive
    ],
    rewards: { gold: 10000, expBonus: 5500 },
    rarityCap: "SSR",
    recommendedPartyLv: 62,
  },
];

export const STAGES: Stage[] = [...C1, ...C2, ...C3, ...C4, ...C5];

export const STAGES_BY_ID: Record<string, Stage> = Object.fromEntries(
  STAGES.map(s => [s.id, s])
);

export const STAGES_BY_CHAPTER: Record<number, Stage[]> = STAGES.reduce(
  (acc, s) => {
    (acc[s.chapter] ??= []).push(s);
    return acc;
  },
  {} as Record<number, Stage[]>
);

export const FIRST_STAGE_ID = "1-1";
