// Procedurally-generated placeholder portraits.
// Returns a data URL SVG so the UI works before real ChatGPT-generated art exists.

import type { Rarity } from "../game/data/characters";
import type { Element } from "../game/data/skills";

const RARITY_COLOR: Record<Rarity, string> = {
  N: "#9ca3af", R: "#3b82f6", SR: "#a855f7", SSR: "#f59e0b", UR: "#ef4444",
};
const ELEMENT_COLOR: Record<Element, string> = {
  fire: "#ff6347", water: "#4aa8ff", wood: "#5fcf6c", light: "#fff8a3", dark: "#9c6cff",
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export interface PlaceholderOptions {
  rarity: Rarity;
  element: Element;
  name: string;
  stage?: 1 | 2 | 3;
  // pose intent (for variety)
  pose?: "portrait" | "battle" | "broken_light" | "broken_heavy";
}

export function placeholderPortrait(opts: PlaceholderOptions): string {
  const { rarity, element, name, stage = 1, pose = "portrait" } = opts;
  const h = hashStr(name + stage);
  const hue = h % 360;
  const skinHue = 20 + (h >> 3) % 30;
  const hairHue = (h >> 5) % 360;
  const aura = RARITY_COLOR[rarity];
  const eyeColor = ELEMENT_COLOR[element];

  // Variations by stage
  const sparkles = stage === 3 ? 10 : stage === 2 ? 5 : 1;
  const dressTone = stage === 1 ? 65 : stage === 2 ? 55 : 45;
  const armorPieces = stage - 1;

  // Pose variations for damage states
  const poseEmote = pose === "broken_light" ? "(>_<)" : pose === "broken_heavy" ? "(x_x)" : pose === "battle" ? "(•̀ᴗ•́)" : "(◕‿◕)";

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 480" preserveAspectRatio="xMidYMid meet">
  <defs>
    <radialGradient id="aura" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${aura}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${aura}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},35%,18%)"/>
      <stop offset="100%" stop-color="hsl(${(hue+30)%360},25%,8%)"/>
    </linearGradient>
    <linearGradient id="dress" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="hsl(${hue},${dressTone}%,55%)"/>
      <stop offset="100%" stop-color="hsl(${(hue+20)%360},${dressTone}%,30%)"/>
    </linearGradient>
  </defs>
  <rect width="360" height="480" fill="url(#bg)"/>
  <circle cx="180" cy="200" r="180" fill="url(#aura)"/>

  <!-- Hair back -->
  <ellipse cx="180" cy="220" rx="100" ry="140" fill="hsl(${hairHue},60%,40%)"/>
  <!-- Body -->
  <path d="M 130,300 Q 180,260 230,300 L 250,480 L 110,480 Z" fill="url(#dress)" stroke="hsl(${hue},60%,25%)" stroke-width="2"/>
  <!-- Cleavage hint for older stages -->
  ${stage >= 2 ? `<path d="M 180,300 Q 180,340 175,360 Q 180,355 185,360 Q 180,340 180,300 Z" fill="hsl(${skinHue},55%,75%)" opacity="0.85"/>` : ""}
  <!-- Neck -->
  <rect x="170" y="190" width="20" height="40" fill="hsl(${skinHue},55%,75%)"/>
  <!-- Head -->
  <ellipse cx="180" cy="170" rx="60" ry="68" fill="hsl(${skinHue},55%,80%)"/>
  <!-- Hair front -->
  <path d="M 120,170 Q 140,90 180,90 Q 220,90 240,170 Q 230,120 200,115 Q 180,135 160,115 Q 130,120 120,170 Z" fill="hsl(${hairHue},60%,45%)"/>
  <!-- Eyes -->
  <ellipse cx="160" cy="170" rx="6" ry="10" fill="${eyeColor}"/>
  <ellipse cx="200" cy="170" rx="6" ry="10" fill="${eyeColor}"/>
  <ellipse cx="160" cy="167" rx="2" ry="3" fill="#fff"/>
  <ellipse cx="200" cy="167" rx="2" ry="3" fill="#fff"/>
  <!-- Mouth -->
  <path d="M 175,200 Q 180,205 185,200" stroke="hsl(${skinHue},50%,40%)" stroke-width="2" fill="none"/>
  <!-- Armor at stage>=2 -->
  ${armorPieces >= 1 ? `<path d="M 120,300 L 145,290 L 145,330 L 120,340 Z" fill="${aura}" opacity="0.8"/>
                       <path d="M 240,300 L 215,290 L 215,330 L 240,340 Z" fill="${aura}" opacity="0.8"/>` : ""}
  ${armorPieces >= 2 ? `<path d="M 150,350 L 210,350 L 200,400 L 160,400 Z" fill="${aura}" opacity="0.6"/>` : ""}
  <!-- Damage marks -->
  ${pose === "broken_light" ? `<line x1="120" y1="380" x2="160" y2="420" stroke="#fff" stroke-width="3" opacity="0.8"/>
                                <line x1="200" y1="350" x2="240" y2="400" stroke="#fff" stroke-width="3" opacity="0.8"/>` : ""}
  ${pose === "broken_heavy" ? `<path d="M 130,330 L 150,360 L 130,380 L 160,400" fill="none" stroke="#fff" stroke-width="3"/>
                                <path d="M 220,300 L 240,340 L 220,360 L 250,390" fill="none" stroke="#fff" stroke-width="3"/>
                                <path d="M 165,440 L 185,420 L 175,460 L 195,455" fill="none" stroke="#fff" stroke-width="2"/>` : ""}
  <!-- Sparkles for rarity -->
  ${Array.from({ length: sparkles }, (_, i) => {
    const angle = (i / sparkles) * Math.PI * 2;
    const x = 180 + Math.cos(angle) * 130;
    const y = 180 + Math.sin(angle) * 130;
    return `<circle cx="${x}" cy="${y}" r="3" fill="${aura}"/>`;
  }).join("")}
  <!-- Frame: rarity badge -->
  <rect x="6" y="6" width="40" height="20" rx="4" fill="${aura}"/>
  <text x="26" y="22" text-anchor="middle" font-size="14" font-family="sans-serif" font-weight="bold" fill="white">${rarity}</text>
  <!-- Element badge -->
  <circle cx="334" cy="22" r="14" fill="${eyeColor}" stroke="#000" stroke-width="1"/>
  <!-- Stage indicator -->
  <text x="180" y="470" text-anchor="middle" font-size="14" font-family="sans-serif" fill="#fff" opacity="0.6">第${stage}形態 ${poseEmote}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Helper to compute portrait for an owned character (uses charId+stage)
export function portraitForChar(charId: string, name: string, rarity: Rarity, element: Element, stage: 1 | 2 | 3, pose: PlaceholderOptions["pose"] = "portrait"): string {
  return placeholderPortrait({ rarity, element, name: charId + name, stage, pose });
}
