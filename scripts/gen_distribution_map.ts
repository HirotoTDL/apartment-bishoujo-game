// =====================================================================
//  分布マップ生成スクリプト
//  実行: npx tsx scripts/gen_distribution_map.ts
//  出力: distribution_map.md
// =====================================================================

import { writeFileSync } from "node:fs";
import { CHARACTERS, CHARACTERS_BY_ID } from "../src/game/data/characters";
import { STAGES, STAGES_BY_CHAPTER } from "../src/game/data/stages";
import { ROLE_LABEL, ELEMENT_LABEL } from "../src/game/data/skills";

type Rarity = "N" | "R" | "SR" | "SSR" | "UR";

// ---------- Per-character analysis ----------

interface CharAppearance {
  stageId: string;
  weight: number;
  totalWeight: number;
  minLv: number;
  maxLv: number;
  isBoss: boolean;
}

const charAppearances = new Map<string, CharAppearance[]>();
for (const c of CHARACTERS) charAppearances.set(c.id, []);

for (const stage of STAGES) {
  const total = stage.encounters.reduce((a, b) => a + b.weight, 0);
  for (const enc of stage.encounters) {
    charAppearances.get(enc.charId)?.push({
      stageId: stage.id,
      weight: enc.weight,
      totalWeight: total,
      minLv: enc.minLv,
      maxLv: enc.maxLv,
      isBoss: false,
    });
  }
  if (stage.bossCharId && stage.bossLv) {
    charAppearances.get(stage.bossCharId)?.push({
      stageId: stage.id,
      weight: 0,
      totalWeight: 0,
      minLv: stage.bossLv,
      maxLv: stage.bossLv,
      isBoss: true,
    });
  }
}

// ---------- Per-chapter rarity rate ----------

interface RarityRate {
  N: number; R: number; SR: number; SSR: number; UR: number;
}

function emptyRate(): RarityRate { return { N: 0, R: 0, SR: 0, SSR: 0, UR: 0 }; }

const chapterRarityRate = new Map<number, RarityRate>();
for (const ch of [1, 2, 3, 4, 5]) {
  const rate = emptyRate();
  let total = 0;
  for (const stage of STAGES_BY_CHAPTER[ch] ?? []) {
    for (const enc of stage.encounters) {
      const c = CHARACTERS_BY_ID[enc.charId];
      if (!c) continue;
      rate[c.rarity] += enc.weight;
      total += enc.weight;
    }
  }
  if (total > 0) {
    rate.N = Math.round(rate.N / total * 1000) / 10;
    rate.R = Math.round(rate.R / total * 1000) / 10;
    rate.SR = Math.round(rate.SR / total * 1000) / 10;
    rate.SSR = Math.round(rate.SSR / total * 1000) / 10;
    rate.UR = Math.round(rate.UR / total * 1000) / 10;
  }
  chapterRarityRate.set(ch, rate);
}

// ---------- Render markdown ----------

function rarityBadge(r: Rarity): string {
  const colors: Record<Rarity, string> = { N: "⚪", R: "🔵", SR: "🟣", SSR: "🟡", UR: "🔴" };
  return `${colors[r]} **${r}**`;
}

let md = `# キャラクター分布マップ

自動生成: \`npx tsx scripts/gen_distribution_map.ts\`

これは現在のステージデータ ([stages.ts](src/game/data/stages.ts)) と
キャラクターデータ ([characters.ts](src/game/data/characters.ts)) を
元に算出した、登場率と分布の一覧です。

---

## 📊 章別のレアリティ出現率(エンカウンタープール内)

| 章 | テーマ | ⚪ N | 🔵 R | 🟣 SR | 🟡 SSR | 🔴 UR | 推奨Lv |
|----|-------|-----|------|------|------|------|--------|
`;

const chapterTitle: Record<number, string> = {
  1: "序章「あなたの新しい住処」",
  2: "「R級住宅地」",
  3: "「SR領域」",
  4: "「SSR名邸」",
  5: "終章「UR聖域」",
};

for (const ch of [1, 2, 3, 4, 5]) {
  const r = chapterRarityRate.get(ch) ?? emptyRate();
  const stagesIn = STAGES_BY_CHAPTER[ch] ?? [];
  const lvMin = Math.min(...stagesIn.flatMap(s => s.encounters.map(e => e.minLv)));
  const lvMax = Math.max(...stagesIn.flatMap(s => [s.bossLv ?? 0, ...s.encounters.map(e => e.maxLv)]));
  const recMin = Math.min(...stagesIn.map(s => s.recommendedPartyLv ?? 1));
  const recMax = Math.max(...stagesIn.map(s => s.recommendedPartyLv ?? 1));
  md += `| ${ch} | ${chapterTitle[ch]} | ${r.N}% | ${r.R}% | ${r.SR}% | ${r.SSR}% | ${r.UR}% | Lv ${recMin}-${recMax} |\n`;
}

md += `

> 注: UR が常に 0% なのは仕様通り。UR は **ボスでしか出現しない**(ランダム遭遇プールには入らない)。
> 終章ボス撃破がコレクション完走の条件となります。

---

## ⚔ 全ステージ一覧

| ID | ステージ名 | 推奨Lv | 戦数 | エンカウントLv | ボス | エンカウントレアリティ |
|----|-----------|-------|------|---------------|------|---------------------|
`;

for (const s of STAGES) {
  const lvMin = Math.min(...s.encounters.map(e => e.minLv));
  const lvMax = Math.max(...s.encounters.map(e => e.maxLv));
  const bossStr = s.bossCharId
    ? `${CHARACTERS_BY_ID[s.bossCharId]?.name ?? s.bossCharId} (${CHARACTERS_BY_ID[s.bossCharId]?.rarity}, Lv${s.bossLv})`
    : "—";
  const rarities = new Set(s.encounters.map(e => CHARACTERS_BY_ID[e.charId]?.rarity));
  const rarStr = ["N", "R", "SR", "SSR", "UR"].filter(r => rarities.has(r as Rarity)).join("/");
  md += `| ${s.id} | ${s.name} | Lv ${s.recommendedPartyLv} | ${s.battlesToClear}戦 | ${lvMin}-${lvMax} | ${bossStr} | ${rarStr} |\n`;
}

md += `

---

## 👥 キャラクター別 登場ステージ

### 凡例
- ◎ = ボス出現 (確定遭遇)
- 数値 = ランダム遭遇プール内の確率(%)
- 確率は同ステージ内の重み合計に対する比率

`;

for (const rarity of ["UR", "SSR", "SR", "R", "N"] as Rarity[]) {
  const chars = CHARACTERS.filter(c => c.rarity === rarity);
  md += `### ${rarityBadge(rarity)} (${chars.length}体)\n\n`;
  md += `| ID | 名前 | 役職 | 属性 | 登場ステージ | レベル帯 |\n`;
  md += `|----|------|------|------|-----------|---------|\n`;
  for (const c of chars) {
    const apps = charAppearances.get(c.id) ?? [];
    let stageStr = "";
    let lvMin = 999, lvMax = 0;
    if (apps.length === 0) {
      stageStr = "❌ 未登場";
    } else {
      const parts: string[] = [];
      for (const a of apps) {
        if (a.isBoss) {
          parts.push(`**${a.stageId}◎**`);
        } else {
          const pct = a.totalWeight > 0 ? (a.weight / a.totalWeight * 100).toFixed(1) : "0";
          parts.push(`${a.stageId} ${pct}%`);
        }
        lvMin = Math.min(lvMin, a.minLv);
        lvMax = Math.max(lvMax, a.maxLv);
      }
      stageStr = parts.join(" / ");
    }
    const lvStr = lvMin <= lvMax ? `Lv ${lvMin}-${lvMax}` : "—";
    md += `| ${c.id} | ${c.name} | ${(ROLE_LABEL as any)[c.role ?? "striker"]} | ${(ELEMENT_LABEL as any)[c.element]} | ${stageStr} | ${lvStr} |\n`;
  }
  md += "\n";
}

// ---------- Boss roster ----------

md += `---

## 👑 ボス分布

| 章 | ステージ | ボス | レアリティ | 役職 | Lv | 取り巻き |
|----|---------|------|---------|------|-----|---------|
`;

for (const s of STAGES) {
  if (!s.bossCharId) continue;
  const c = CHARACTERS_BY_ID[s.bossCharId];
  if (!c) continue;
  const minionCount = Math.min(3, Math.max(0, s.chapter - 1));
  md += `| ${s.chapter} | ${s.id} | **${c.name}** | ${c.rarity} | ${(ROLE_LABEL as any)[c.role ?? "striker"]} | ${s.bossLv} | ${minionCount}体 |\n`;
}

// ---------- Difficulty curve ----------

md += `

---

## 📈 難易度カーブ

| 章 | 推奨Lv | 平均敵Lv | ボスLv | 想定戦闘時間 (boss) |
|----|--------|---------|--------|------------------|
`;

for (const ch of [1, 2, 3, 4, 5]) {
  const stagesIn = STAGES_BY_CHAPTER[ch] ?? [];
  const avgLv = Math.round(
    stagesIn.flatMap(s => s.encounters.flatMap(e => [e.minLv, e.maxLv])).reduce((a, b) => a + b, 0) /
    Math.max(1, stagesIn.flatMap(s => s.encounters.flatMap(e => [e.minLv, e.maxLv])).length)
  );
  const bossLv = Math.max(...stagesIn.map(s => s.bossLv ?? 0));
  const recMin = Math.min(...stagesIn.map(s => s.recommendedPartyLv ?? 1));
  const recMax = Math.max(...stagesIn.map(s => s.recommendedPartyLv ?? 1));
  const battleTimeBoss = ch === 1 ? "1分" : ch === 2 ? "1.5分" : ch === 3 ? "2分" : ch === 4 ? "2.5分" : "3-4分";
  md += `| ${ch} | Lv ${recMin}-${recMax} | Lv ${avgLv} | Lv ${bossLv} | ${battleTimeBoss} |\n`;
}

// ---------- Collection milestones ----------

md += `

---

## 🎯 コレクション完走目安

| 章クリア時 | 期待コレクション数 | 内訳 |
|----------|----------------|------|
| Ch1完了 | 約 12-15 体 | N 約 12-15 |
| Ch2完了 | 約 20-25 体 | N 約 13-16 + R 約 7-9 |
| Ch3完了 | 約 28-32 体 | + SR 約 4-5 |
| Ch4完了 | 約 35-42 体 | + SSR 約 2-3 |
| Ch5完了 | **最大 50 体** | + UR 2 (ボス撃破&捕獲) |

> 全完走には UR ボス 2体の捕獲が必要。捕獲率は HP 0% + ブレイク+状態異常+マスター契約書で最大化。

---

## 🎲 各章のキャラ出現上限

| 章 | 出現キャラ数 | エンカウンタープール |
|----|-----------|------------------|
`;

for (const ch of [1, 2, 3, 4, 5]) {
  const stagesIn = STAGES_BY_CHAPTER[ch] ?? [];
  const charSet = new Set<string>();
  for (const s of stagesIn) {
    for (const e of s.encounters) charSet.add(e.charId);
    if (s.bossCharId) charSet.add(s.bossCharId);
  }
  md += `| ${ch} | ${charSet.size} 体 | ${[...charSet].slice(0, 12).join(", ")}${charSet.size > 12 ? "..." : ""} |\n`;
}

// ---------- Coverage check ----------

const missingChars = CHARACTERS.filter(c => (charAppearances.get(c.id) ?? []).length === 0);
md += `

---

## ✅ カバレッジチェック

`;
if (missingChars.length === 0) {
  md += `**全 ${CHARACTERS.length} 体がいずれかのステージに登場可能**(全員入手可能)。\n`;
} else {
  md += `⚠️ 以下 ${missingChars.length} 体がどのステージにも登場しません:\n`;
  for (const c of missingChars) {
    md += `- ${c.id}: ${c.name} (${c.rarity}) — 要追加配置\n`;
  }
}

md += `\n---\n\n*このファイルは自動生成です。stages.ts を変更したら \`npx tsx scripts/gen_distribution_map.ts\` で再生成してください。*\n`;

writeFileSync("distribution_map.md", md, "utf-8");
console.log(`✅ Generated distribution_map.md (${md.length} chars, ${missingChars.length} missing chars)`);
