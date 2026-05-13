// Stage progression: pick encounters, handle rewards and unlock chain
import { STAGES, STAGES_BY_ID, type Stage } from "./data/stages";
import { makeWildUnit } from "./growth";
import type { BattleUnit } from "./types";

function weightedPick<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((a, b) => a + b.weight, 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight;
    if (r < 0) return it;
  }
  return items[items.length - 1];
}

export interface StageProgress {
  stageId: string;
  battlesCompleted: number;   // 1..battlesToClear
  battlesToClear: number;
}

export function startStage(stageId: string): StageProgress {
  const stage = STAGES_BY_ID[stageId];
  return {
    stageId,
    battlesCompleted: 0,
    battlesToClear: stage.battlesToClear,
  };
}

export function nextEncounter(progress: StageProgress): BattleUnit[] {
  const stage = STAGES_BY_ID[progress.stageId];
  const isFinal = progress.battlesCompleted + 1 === progress.battlesToClear;
  if (isFinal && stage.bossCharId && stage.bossLv) {
    return [makeWildUnit(stage.bossCharId, stage.bossLv)];
  }
  // Pick 1-2 enemies
  const numEnemies = Math.random() < 0.3 ? 2 : 1;
  const enemies: BattleUnit[] = [];
  for (let i = 0; i < numEnemies; i++) {
    const pick = weightedPick(stage.encounters);
    const lvl = randInt(pick.minLv, pick.maxLv);
    enemies.push(makeWildUnit(pick.charId, lvl));
  }
  return enemies;
}

function randInt(a: number, b: number) {
  return Math.floor(a + Math.random() * (b - a + 1));
}

export function recordBattleWon(progress: StageProgress): { stageCleared: boolean; stage: Stage } {
  const stage = STAGES_BY_ID[progress.stageId];
  progress.battlesCompleted += 1;
  return { stageCleared: progress.battlesCompleted >= progress.battlesToClear, stage };
}

export function nextStagesToUnlock(clearedStageId: string): string[] {
  return STAGES.filter(s => s.unlockAfter === clearedStageId).map(s => s.id);
}
