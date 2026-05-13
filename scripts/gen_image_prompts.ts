// Generate ChatGPT image-generation prompts for every character × stage × pose.
// Usage:  npx tsx scripts/gen_image_prompts.ts
// Outputs: ./image_prompts.md (human-readable) and ./image_prompts.json (machine).

import { writeFileSync } from "node:fs";
import { CHARACTERS } from "../src/game/data/characters";

const POSES = [
  { id: "portrait_normal", label: "立ち絵・通常", emote: "穏やかな微笑み" },
  { id: "portrait_smile", label: "立ち絵・笑顔", emote: "明るく満面の笑顔" },
  { id: "portrait_serious", label: "立ち絵・真剣", emote: "凛とした真剣な表情" },
  { id: "battle_attack", label: "戦闘絵・攻撃", emote: "技を放つ瞬間、目力が強い" },
  { id: "battle_defend", label: "戦闘絵・防御", emote: "武器/腕で防御するポーズ" },
  { id: "broken_light", label: "半破壊絵", emote: "息切れ、頬の汚れ、衣装に裂け目少々" },
  { id: "broken_heavy", label: "全破壊絵", emote: "膝立ちまたは座り込み、衣装ボロボロ、髪は乱れる(肌の露出は谷間/太もも程度に限定、卑猥でない)" },
  { id: "expression_joy", label: "表情・喜び", emote: "両目を細めての満面の笑顔、頬染め少々" },
  { id: "expression_sad", label: "表情・悲しみ", emote: "うつむき気味、瞳に涙" },
  { id: "expression_angry", label: "表情・怒り", emote: "眉を吊り上げ、口を結ぶ" },
  { id: "expression_shy", label: "表情・照れ", emote: "頬を赤らめ、視線を逸らす" },
  { id: "expression_surprise", label: "表情・驚き", emote: "目を見開き、口を小さく開ける" },
  { id: "evolve_glow", label: "進化演出", emote: "光に包まれ、髪と衣装が舞う神々しい瞬間" },
  { id: "victory", label: "勝利ポーズ", emote: "片手を掲げてのガッツポーズ、後光" },
  { id: "defeat", label: "敗北ポーズ", emote: "うつむいて膝に手をつくが、瞳には希望" },
];

const ELEMENT_LABEL: Record<string, string> = {
  fire: "火属性(赤系・炎)", water: "水属性(青系・水流)", wood: "木属性(緑系・葉)",
  light: "光属性(白金系・光輝)", dark: "闇属性(紫黒系・影)",
};

const STYLE_BASE = `背景透過PNG、立ち絵全身、頭頂から足元まで収まる縦長構図、
アニメ調、線画は柔らかめでアニメ塗り。
キャラクターの全身がはっきり見えるよう余白を確保。
日本のアパート/レジデンス名に由来する美少女キャラクター。
表現範囲: PG-13相当。胸の谷間・太もも・露出度高めの衣装は許容するが、性器/乳首は描かない。年齢は18歳以上に見えるよう描く。`;

interface PromptEntry {
  charId: string;
  charName: string;
  rarity: string;
  element: string;
  apartmentSource: string;
  stage: 1 | 2 | 3;
  poseId: string;
  poseLabel: string;
  prompt: string;
  filename: string;
}

const entries: PromptEntry[] = [];

for (const c of CHARACTERS) {
  for (const evo of c.evolutions) {
    for (const pose of POSES) {
      const prompt =
        `${STYLE_BASE}\n\n` +
        `■キャラクター: ${c.name} (元アパート名: ${c.apartmentSource})\n` +
        `■レアリティ: ${c.rarity} (UR>SSR>SR>R>N の${c.rarity})\n` +
        `■属性: ${ELEMENT_LABEL[c.element]}\n` +
        `■進化段階: 第${evo.stage}形態 (Lv${evo.unlockLv})\n` +
        `■衣装/外観: ${evo.description}\n` +
        `■ポーズ/表情: ${pose.label} — ${pose.emote}\n` +
        `■世界観: ${c.lore}\n\n` +
        `出力指示: 透過PNG・1024x1536px・キャラクター単体のみ・装飾以外の背景なし。`;

      entries.push({
        charId: c.id,
        charName: c.name,
        rarity: c.rarity,
        element: c.element,
        apartmentSource: c.apartmentSource,
        stage: evo.stage,
        poseId: pose.id,
        poseLabel: pose.label,
        prompt,
        filename: `public/assets/characters/${c.id}/stage${evo.stage}/${pose.id}.png`,
      });
    }
  }
}

// JSON output
writeFileSync(
  "image_prompts.json",
  JSON.stringify({ total: entries.length, entries }, null, 2),
  "utf-8"
);

// Markdown output
let md = `# 画像生成プロンプト一覧\n\n`;
md += `総数: **${entries.length}件** (50キャラ × 3段階 × 15ポーズ)\n\n`;
md += `画像はChatGPTのDALL·E、または安定したSDXL等で生成。各エントリは透過PNG・1024x1536px推奨。\n\n`;
md += `---\n\n`;
let lastChar = "";
let lastStage = -1;
for (const e of entries) {
  if (e.charName !== lastChar) {
    md += `\n## ${e.charName} (${e.rarity} / ${e.charId})\n\n`;
    lastChar = e.charName;
    lastStage = -1;
  }
  if (e.stage !== lastStage) {
    md += `\n### 第${e.stage}形態\n\n`;
    lastStage = e.stage;
  }
  md += `#### ${e.poseLabel} — \`${e.filename}\`\n\n`;
  md += `\`\`\`\n${e.prompt}\n\`\`\`\n\n`;
}
writeFileSync("image_prompts.md", md, "utf-8");

console.log(`Generated ${entries.length} prompts.`);
console.log(`  -> image_prompts.md`);
console.log(`  -> image_prompts.json`);
