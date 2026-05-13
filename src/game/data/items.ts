// Item master data
export type ItemKind = "consumable" | "capture" | "material" | "evolve";

export interface ItemMaster {
  id: string;
  name: string;
  description: string;
  kind: ItemKind;
  price?: number;             // shop price; undefined = not sold
  // For capture items: capture rate multiplier
  captureMultiplier?: number;
  // For consumables: target stat effect
  effect?: {
    targetStat?: "hp" | "mp";
    amount?: number;
  };
}

export const ITEMS: Record<string, ItemMaster> = {
  rent_card: {
    id: "rent_card",
    name: "賃貸契約書",
    description: "標準的な捕獲アイテム。捕獲率1.0倍。",
    kind: "capture",
    price: 200,
    captureMultiplier: 1.0,
  },
  premium_card: {
    id: "premium_card",
    name: "プレミアム契約書",
    description: "高性能の捕獲アイテム。捕獲率1.5倍。",
    kind: "capture",
    price: 600,
    captureMultiplier: 1.5,
  },
  luxury_card: {
    id: "luxury_card",
    name: "高級契約書",
    description: "豪奢な捕獲アイテム。捕獲率2.5倍。",
    kind: "capture",
    price: 1800,
    captureMultiplier: 2.5,
  },
  master_card: {
    id: "master_card",
    name: "マスターキー契約書",
    description: "ほぼ確実に捕獲する伝説の契約書。捕獲率5倍。",
    kind: "capture",
    price: 8000,
    captureMultiplier: 5.0,
  },
  potion_s: {
    id: "potion_s",
    name: "小回復薬",
    description: "HPを50回復",
    kind: "consumable",
    price: 100,
    effect: { targetStat: "hp", amount: 50 },
  },
  potion_m: {
    id: "potion_m",
    name: "中回復薬",
    description: "HPを200回復",
    kind: "consumable",
    price: 400,
    effect: { targetStat: "hp", amount: 200 },
  },
  potion_l: {
    id: "potion_l",
    name: "大回復薬",
    description: "HPを600回復",
    kind: "consumable",
    price: 1200,
    effect: { targetStat: "hp", amount: 600 },
  },
  ether_s: {
    id: "ether_s",
    name: "小マナドリンク",
    description: "MPを30回復",
    kind: "consumable",
    price: 200,
    effect: { targetStat: "mp", amount: 30 },
  },
};

// Default starter inventory
export const STARTER_INVENTORY: Record<string, number> = {
  rent_card: 5,
  potion_s: 3,
};
