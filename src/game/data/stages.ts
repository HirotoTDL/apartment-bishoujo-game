// Stage / chapter master data
import type { Rarity } from "./characters";

export interface StageEncounter {
  charId: string;
  weight: number;       // relative spawn weight within this stage
  minLv: number;
  maxLv: number;
}

export interface Stage {
  id: string;
  chapter: number;
  index: number;        // index within chapter (1..N)
  name: string;
  description: string;
  unlockAfter?: string;    // stage id required to unlock
  battlesToClear: number;  // how many encounters before clear
  bossCharId?: string;     // optional fixed boss at last encounter
  bossLv?: number;
  encounters: StageEncounter[];
  rewards: {
    gold: number;
    expBonus: number;
    items?: Array<{ itemId: string; qty: number }>;
  };
  rarityCap?: Rarity;     // optional ceiling on encounter rarity
}

// Quick helpers
const e = (charId: string, weight: number, minLv: number, maxLv: number): StageEncounter => ({ charId, weight, minLv, maxLv });

// Chapter 1: 序章「あなたの新しい住処」(N pool only)
const C1: Stage[] = [
  {
    id: "1-1",
    chapter: 1,
    index: 1,
    name: "築浅レジデンス前",
    description: "あなたが越してきたばかりの『レジデンスめぐみ』前。住人たちが歓迎にやって来る。",
    battlesToClear: 3,
    bossCharId: "n_001",
    bossLv: 3,
    encounters: [
      e("n_001", 30, 1, 3),
      e("n_002", 30, 1, 3),
      e("n_003", 20, 1, 2),
      e("n_005", 20, 1, 2),
    ],
    rewards: { gold: 100, expBonus: 50 },
    rarityCap: "N",
  },
  {
    id: "1-2",
    chapter: 1,
    index: 2,
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
    rewards: { gold: 150, expBonus: 70 },
    rarityCap: "N",
  },
  {
    id: "1-3",
    chapter: 1,
    index: 3,
    name: "コーポさくら並木",
    description: "桜並木の参道沿い。春先に多くの住人が集まる。",
    unlockAfter: "1-2",
    battlesToClear: 3,
    bossCharId: "n_005",
    bossLv: 6,
    encounters: [
      e("n_005", 25, 3, 5),
      e("n_007", 25, 3, 5),
      e("n_010", 25, 3, 5),
      e("n_023", 25, 3, 5),
    ],
    rewards: { gold: 200, expBonus: 100 },
    rarityCap: "N",
  },
  {
    id: "1-4",
    chapter: 1,
    index: 4,
    name: "ハイツ風の丘",
    description: "高台のハイツ群。風が強い。",
    unlockAfter: "1-3",
    battlesToClear: 4,
    encounters: [
      e("n_003", 20, 4, 6),
      e("n_015", 25, 4, 6),
      e("n_021", 25, 4, 6),
      e("n_009", 30, 4, 6),
    ],
    rewards: { gold: 250, expBonus: 130 },
    rarityCap: "N",
  },
  {
    id: "1-5",
    chapter: 1,
    index: 5,
    name: "ヴィラ通り終端",
    description: "ヴィラとパークが入り交じる通りの終わり。次章への入口。",
    unlockAfter: "1-4",
    battlesToClear: 5,
    bossCharId: "n_010",
    bossLv: 10,
    encounters: [
      e("n_010", 20, 6, 9),
      e("n_020", 20, 6, 9),
      e("n_022", 20, 6, 9),
      e("n_024", 20, 6, 9),
      e("n_017", 20, 6, 9),
    ],
    rewards: { gold: 400, expBonus: 200 },
    rarityCap: "N",
  },
];

// Chapter 2: 「R級住宅地」(R pool + occasional N)
const C2: Stage[] = [
  {
    id: "2-1",
    chapter: 2,
    index: 1,
    name: "ベルメゾン桜並木",
    description: "中堅住宅地、桜の名所。",
    unlockAfter: "1-5",
    battlesToClear: 4,
    encounters: [
      e("r_001", 15, 8, 12),
      e("r_002", 15, 8, 12),
      e("r_006", 25, 8, 12),
      e("n_005", 15, 8, 12),
      e("n_023", 15, 8, 12),
      e("r_010", 15, 8, 12),
    ],
    rewards: { gold: 500, expBonus: 250 },
    rarityCap: "R",
  },
  {
    id: "2-2",
    chapter: 2,
    index: 2,
    name: "海岸沿いグランブルー",
    description: "海に面した区画。",
    unlockAfter: "2-1",
    battlesToClear: 4,
    encounters: [
      e("r_007", 25, 10, 14),
      e("r_011", 25, 10, 14),
      e("r_013", 20, 10, 14),
      e("n_004", 15, 10, 14),
      e("n_019", 15, 10, 14),
    ],
    rewards: { gold: 600, expBonus: 300 },
    rarityCap: "R",
  },
  {
    id: "2-3",
    chapter: 2,
    index: 3,
    name: "ロイヤルガーデン",
    description: "高級志向のフローラ区画。",
    unlockAfter: "2-2",
    battlesToClear: 4,
    encounters: [
      e("r_003", 25, 12, 16),
      e("r_005", 25, 12, 16),
      e("r_012", 25, 12, 16),
      e("r_008", 25, 12, 16),
    ],
    rewards: { gold: 700, expBonus: 350 },
    rarityCap: "R",
  },
  {
    id: "2-4",
    chapter: 2,
    index: 4,
    name: "情熱ヴィラ",
    description: "南国的なエリア。",
    unlockAfter: "2-3",
    battlesToClear: 5,
    bossCharId: "r_004",
    bossLv: 18,
    encounters: [
      e("r_004", 25, 14, 18),
      e("r_009", 25, 14, 18),
      e("r_015", 25, 14, 18),
      e("r_014", 25, 14, 18),
    ],
    rewards: { gold: 900, expBonus: 450 },
    rarityCap: "R",
  },
];

// Chapter 3: 「SR領域」
const C3: Stage[] = [
  {
    id: "3-1",
    chapter: 3,
    index: 1,
    name: "コンテッサ通り",
    description: "高級住宅地。貴族令嬢たちが闊歩する。",
    unlockAfter: "2-4",
    battlesToClear: 5,
    encounters: [
      e("sr_001", 20, 18, 22),
      e("r_001", 20, 18, 22),
      e("r_009", 20, 18, 22),
      e("sr_002", 20, 18, 22),
      e("sr_005", 20, 18, 22),
    ],
    rewards: { gold: 1200, expBonus: 600 },
    rarityCap: "SR",
  },
  {
    id: "3-2",
    chapter: 3,
    index: 2,
    name: "天使のメゾン",
    description: "天使のような少女が集う。",
    unlockAfter: "3-1",
    battlesToClear: 5,
    encounters: [
      e("sr_003", 25, 20, 25),
      e("r_002", 20, 20, 25),
      e("r_005", 20, 20, 25),
      e("sr_004", 20, 20, 25),
      e("sr_005", 15, 20, 25),
    ],
    rewards: { gold: 1400, expBonus: 700 },
    rarityCap: "SR",
  },
  {
    id: "3-3",
    chapter: 3,
    index: 3,
    name: "月夜のサンクチュアリ",
    description: "魔女や占星術師の住む夜の街。",
    unlockAfter: "3-2",
    battlesToClear: 6,
    bossCharId: "sr_004",
    bossLv: 28,
    encounters: [
      e("sr_004", 30, 22, 28),
      e("sr_002", 20, 22, 28),
      e("r_014", 20, 22, 28),
      e("r_015", 15, 22, 28),
      e("sr_001", 15, 22, 28),
    ],
    rewards: { gold: 1800, expBonus: 900 },
    rarityCap: "SR",
  },
];

// Chapter 4: 「SSR名邸」
const C4: Stage[] = [
  {
    id: "4-1",
    chapter: 4,
    index: 1,
    name: "ハートフルパレス",
    description: "心優しき守護者の宮殿。",
    unlockAfter: "3-3",
    battlesToClear: 5,
    bossCharId: "ssr_001",
    bossLv: 35,
    encounters: [
      e("ssr_001", 30, 28, 32),
      e("sr_001", 20, 28, 32),
      e("sr_003", 15, 28, 32),
      e("r_005", 20, 28, 32),
      e("ssr_002", 15, 28, 32),
    ],
    rewards: { gold: 2500, expBonus: 1200 },
    rarityCap: "SSR",
  },
  {
    id: "4-2",
    chapter: 4,
    index: 2,
    name: "ロイヤルベルサイユ宮",
    description: "華麗なる王侯貴族の館。",
    unlockAfter: "4-1",
    battlesToClear: 6,
    bossCharId: "ssr_002",
    bossLv: 40,
    encounters: [
      e("ssr_002", 30, 32, 38),
      e("ssr_003", 20, 32, 38),
      e("ssr_004", 20, 32, 38),
      e("sr_002", 15, 32, 38),
      e("sr_005", 15, 32, 38),
    ],
    rewards: { gold: 3500, expBonus: 1600 },
    rarityCap: "SSR",
  },
];

// Chapter 5: 「UR聖域」最終章
const C5: Stage[] = [
  {
    id: "5-1",
    chapter: 5,
    index: 1,
    name: "グランエルディオン聖殿",
    description: "創世の光に至る最高位レジデンス。",
    unlockAfter: "4-2",
    battlesToClear: 7,
    bossCharId: "ur_001",
    bossLv: 50,
    encounters: [
      e("ur_001", 10, 42, 50),
      e("ssr_001", 20, 42, 50),
      e("ssr_004", 20, 42, 50),
      e("sr_003", 25, 42, 50),
      e("ssr_002", 25, 42, 50),
    ],
    rewards: { gold: 5000, expBonus: 2500 },
  },
  {
    id: "5-2",
    chapter: 5,
    index: 2,
    name: "ノワール・サンクチュアリ深層",
    description: "深淵の女王が君臨する闇の聖域。",
    unlockAfter: "5-1",
    battlesToClear: 8,
    bossCharId: "ur_002",
    bossLv: 60,
    encounters: [
      e("ur_002", 10, 50, 60),
      e("ssr_002", 20, 50, 60),
      e("sr_004", 25, 50, 60),
      e("r_014", 20, 50, 60),
      e("ssr_003", 25, 50, 60),
    ],
    rewards: { gold: 8000, expBonus: 4000 },
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
