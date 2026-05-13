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

  // Helper: how many enemies for this chapter, capped at 4
  function scaleByChapter(min: number, max: number): number {
    const lo = Math.min(4, Math.max(1, min));
    const hi = Math.min(4, Math.max(lo, max));
    return randInt(lo, hi);
  }

  const enemies: BattleUnit[] = [];

  if (isFinal && stage.bossCharId && stage.bossLv) {
    // Boss battle: boss + minions (more minions in later chapters)
    enemies.push(makeWildUnit(stage.bossCharId, stage.bossLv));
    const minionCount = Math.min(3, Math.max(0, stage.chapter - 1));
    for (let i = 0; i < minionCount; i++) {
      const pick = weightedPick(stage.encounters);
      const lvl = Math.max(1, randInt(pick.minLv, pick.maxLv) - 2);
      enemies.push(makeWildUnit(pick.charId, lvl));
    }
    return enemies;
  }

  // Regular encounter: 1-4 enemies based on chapter progression
  // Chapter 1: 1-2, Chapter 2: 2-3, Chapter 3+: 2-4, Chapter 4-5: 3-4
  let numEnemies: number;
  if (stage.chapter === 1) numEnemies = scaleByChapter(1, 2);
  else if (stage.chapter === 2) numEnemies = scaleByChapter(2, 3);
  else if (stage.chapter === 3) numEnemies = scaleByChapter(2, 4);
  else numEnemies = scaleByChapter(3, 4);

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
