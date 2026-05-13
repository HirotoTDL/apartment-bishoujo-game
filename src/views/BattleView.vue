<script setup lang="ts">
import { ref, computed, onMounted, nextTick, reactive } from "vue";
import { useRouter } from "vue-router";
import { usePlayerStore } from "../stores/player";
import { startStage, nextEncounter, recordBattleWon } from "../game/stageRunner";
import { toBattleUnit, expReward } from "../game/growth";
import { createBattle, executeTurn, attemptCapture, captureProbability, type BattleState, type PendingAction } from "../game/battle";
import { SKILLS } from "../game/data/skills";
import { ITEMS } from "../game/data/items";
import { STAGES_BY_ID } from "../game/data/stages";
import { CHARACTERS_BY_ID } from "../game/data/characters";
import { portraitForChar } from "../assets/placeholder";
import AnimatedBackground from "../components/AnimatedBackground.vue";
import Icon from "../components/Icon.vue";
import RarityStars from "../components/RarityStars.vue";
import type { BattleUnit } from "../game/types";

const props = defineProps<{ stageId: string }>();
const router = useRouter();
const player = usePlayerStore();

const progress = ref(startStage(props.stageId));
const battle = ref<BattleState | null>(null);
const selectedSkillId = ref<string | null>(null);
const selectedTarget = ref<BattleUnit | null>(null);
const showItemMenu = ref(false);
const showCaptureMenu = ref(false);
const animating = ref(false);
const battleOver = ref(false);
const rewardSummary = ref<{ gold: number; exp: number; events: any[]; captured?: BattleUnit } | null>(null);

const screenShake = ref<"" | "shake" | "shake-hard">("");
const flashOverlay = ref<{ color: string } | null>(null);
const popups = reactive<Array<{ id: number; unitRef: BattleUnit; value: number; kind: string; crit: boolean }>>([]);
let popupId = 0;
const skillFlashes = reactive<Array<{ id: number; unitRef: BattleUnit; element: string }>>([]);
let flashId = 0;

const stage = computed(() => STAGES_BY_ID[props.stageId]);

function pushPopup(unit: BattleUnit, value: number, kind: string, crit = false) {
  popups.push({ id: ++popupId, unitRef: unit, value, kind, crit });
  setTimeout(() => {
    const idx = popups.findIndex(p => p.id === popupId);
    if (idx >= 0) popups.splice(idx, 1);
  }, 1300);
}
function pushSkillFlash(unit: BattleUnit, element: string) {
  skillFlashes.push({ id: ++flashId, unitRef: unit, element });
  setTimeout(() => {
    const idx = skillFlashes.findIndex(f => f.id === flashId);
    if (idx >= 0) skillFlashes.splice(idx, 1);
  }, 800);
}

function buildBattle() {
  const allyUnits = player.party.map(c => toBattleUnit(c, "ally"));
  const enemies = nextEncounter(progress.value);
  for (const e of enemies) player.seenRarity(e.rarity);
  battle.value = createBattle(allyUnits, enemies);
  selectedSkillId.value = battle.value.allies[0]?.skills[0] ?? null;
  selectedTarget.value = battle.value.enemies[0] ?? null;
  battleOver.value = false;
  rewardSummary.value = null;
}

onMounted(() => {
  if (player.party.length === 0) { router.replace({ name: "party" }); return; }
  buildBattle();
});

const activeAlly = computed(() => battle.value?.allies.find(a => a.hp > 0) ?? null);

const usableSkills = computed(() => {
  if (!activeAlly.value) return [];
  return activeAlly.value.skills.map(id => SKILLS[id]).filter(Boolean)
    .map(s => ({ ...s, usable: activeAlly.value!.mp >= s.mpCost }));
});
const captureItems = computed(() => Object.values(ITEMS).filter(i => i.kind === "capture" && (player.items[i.id] ?? 0) > 0));
const consumables = computed(() => Object.values(ITEMS).filter(i => i.kind === "consumable" && (player.items[i.id] ?? 0) > 0));

function pickSkill(skillId: string) { selectedSkillId.value = skillId; }
function pickTarget(u: BattleUnit) { if (u.hp > 0) selectedTarget.value = u; }
function shake(intensity: "shake" | "shake-hard" = "shake") {
  screenShake.value = intensity;
  setTimeout(() => { screenShake.value = ""; }, 600);
}
function flash(color: string) {
  flashOverlay.value = { color };
  setTimeout(() => { flashOverlay.value = null; }, 300);
}

async function runTurn(action: PendingAction) {
  if (!battle.value) return;
  const before = new Map<BattleUnit, number>();
  for (const u of [...battle.value.allies, ...battle.value.enemies]) before.set(u, u.hp);
  executeTurn(battle.value, action);
  let majorHit = false;
  for (const u of [...battle.value.allies, ...battle.value.enemies]) {
    const prev = before.get(u) ?? u.hp;
    const delta = u.hp - prev;
    if (delta === 0) continue;
    if (delta < 0) {
      const skillElem = action.skillId ? SKILLS[action.skillId]?.element ?? "physical" : "physical";
      const crit = Math.abs(delta) > u.hpMax * 0.25;
      pushPopup(u, delta, skillElem, crit);
      if (Math.abs(delta) > u.hpMax * 0.4) majorHit = true;
    } else {
      pushPopup(u, delta, "heal");
    }
  }
  if (action.kind === "skill" && action.skillId) {
    const s = SKILLS[action.skillId];
    if (s && (s.kind === "attack" || s.kind === "heal")) {
      const targets = battle.value.enemies.filter(e => before.has(e) && (before.get(e)! - e.hp) > 0);
      for (const t of targets) pushSkillFlash(t, s.element);
      const elementColorMap: Record<string, string> = { fire: "#ff6b47", water: "#3aa8ff", wood: "#42d977", light: "#ffe066", dark: "#9c6cff" };
      flash(elementColorMap[s.element] ?? "#ffffff");
    }
  }
  if (majorHit) shake("shake-hard"); else if (action.kind === "skill") shake();
  await nextTick();
  scrollLog();
  if (battle.value.phase === "end_victory") handleVictory();
  else if (battle.value.phase === "end_defeat") handleDefeat();
}

async function confirmAttack() {
  if (!battle.value || !activeAlly.value || !selectedSkillId.value) return;
  const target = selectedTarget.value && battle.value.enemies.includes(selectedTarget.value) && selectedTarget.value.hp > 0
    ? selectedTarget.value
    : battle.value.enemies.find(e => e.hp > 0)!;
  animating.value = true;
  await runTurn({ actor: activeAlly.value, kind: "skill", skillId: selectedSkillId.value, targetUnit: target });
  animating.value = false;
}

async function confirmCapture(itemId: string) {
  if (!battle.value) return;
  showCaptureMenu.value = false;
  const target = selectedTarget.value && battle.value.enemies.includes(selectedTarget.value) && selectedTarget.value.hp > 0
    ? selectedTarget.value : battle.value.enemies.find(e => e.hp > 0 && e.isWild)!;
  if (!target) { battle.value.log.push({ text: "捕獲できる対象がいない！", kind: "info" }); return; }
  player.bumpStat("capturesAttempted");
  const item = ITEMS[itemId];
  player.consumeItem(itemId, 1);
  const result = attemptCapture(battle.value, target, item.captureMultiplier ?? 1);
  battle.value.log.push(...result.logs);
  if (result.success && battle.value.capturedUnit) {
    battle.value.phase = "end_victory";
    rewardSummary.value = { gold: 0, exp: 0, events: [], captured: battle.value.capturedUnit };
    handleVictory();
  } else {
    animating.value = true;
    await runTurn({ actor: activeAlly.value!, kind: "skill", skillId: "s_strike", targetUnit: target });
    animating.value = false;
  }
}
async function confirmItem(itemId: string) {
  if (!battle.value || !activeAlly.value) return;
  const item = ITEMS[itemId]; if (!item) return;
  showItemMenu.value = false;
  player.consumeItem(itemId, 1);
  animating.value = true;
  await runTurn({ actor: activeAlly.value, kind: "item", itemId, targetUnit: activeAlly.value });
  animating.value = false;
}
async function confirmFlee() {
  if (!battle.value || !activeAlly.value) return;
  animating.value = true;
  await runTurn({ actor: activeAlly.value, kind: "flee" });
  animating.value = false;
  if (battle.value.phase === "fled") { syncHpMpToPlayer(); router.replace({ name: "stages" }); }
}

function handleVictory() {
  if (!battle.value) return;
  const fallenEnemies = battle.value.enemies;
  const totalExp = fallenEnemies.reduce((a, b) => a + expReward(b), 0);
  const stageReward = stage.value.rewards;
  const goldReward = Math.floor(stageReward.gold / stage.value.battlesToClear);
  const expGain = Math.floor((totalExp + stageReward.expBonus / stage.value.battlesToClear) / Math.max(1, player.party.length));
  player.earnGold(goldReward);
  const events = player.distributeExp(expGain);
  player.bumpStat("battlesWon");
  if (rewardSummary.value?.captured) { const c = rewardSummary.value.captured; player.addCaptured(c.charId, c.level); }
  syncHpMpToPlayer();
  rewardSummary.value = { gold: goldReward, exp: expGain, events, captured: rewardSummary.value?.captured };
  const { stageCleared } = recordBattleWon(progress.value);
  battleOver.value = true;
  if (stageCleared) player.clearStage(props.stageId);
  player.persist();
}
function handleDefeat() { player.bumpStat("battlesLost"); syncHpMpToPlayer(); battleOver.value = true; player.persist(); }
function syncHpMpToPlayer() {
  if (!battle.value) return;
  const m = new Map<string, { hp: number; mp: number }>();
  for (const u of battle.value.allies) if (u.refUid) m.set(u.refUid, { hp: u.hp, mp: u.mp });
  player.syncBattleHpMp(m);
}
function nextBattle() { rewardSummary.value = null; buildBattle(); }
function exit() { router.replace({ name: "stages" }); }

const logRef = ref<HTMLDivElement | null>(null);
function scrollLog() { if (logRef.value) logRef.value.scrollTop = logRef.value.scrollHeight; }

function portraitOf(u: BattleUnit, pose: "portrait" | "battle" | "broken_light" | "broken_heavy" = "battle"): string {
  const m = CHARACTERS_BY_ID[u.charId]!;
  const hpRatio = u.hp / Math.max(1, u.hpMax);
  const effectivePose: typeof pose = u.hp === 0 ? "broken_heavy" : hpRatio < 0.3 ? "broken_heavy" : hpRatio < 0.6 ? "broken_light" : pose;
  return portraitForChar(m.id, m.name, m.rarity, m.element, u.stage, effectivePose);
}

function captureChance(target: BattleUnit, itemMul: number) { return Math.round(captureProbability(target, itemMul) * 100); }
function stageDoneAfter(): boolean { return progress.value.battlesCompleted >= progress.value.battlesToClear; }

function skillIconFor(s: any): string {
  if (s.kind === "heal") return "heart";
  if (s.kind === "buff") return "arrow-up";
  if (s.kind === "debuff") return "arrow-down";
  if (s.element && ["fire", "water", "wood", "light", "dark"].includes(s.element)) return s.element;
  return "sword";
}
const skillElementColor: Record<string, string> = { fire: "#ff6b47", water: "#3aa8ff", wood: "#42d977", light: "#ffe066", dark: "#9c6cff" };
</script>

<template>
  <div v-if="battle" class="bt-root" :class="{ 'animate-shake': screenShake === 'shake', 'animate-shake-hard': screenShake === 'shake-hard' }">
    <AnimatedBackground :variant="(battle.enemies[0]?.element as any) || 'cosmic'" intensity="normal" />

    <!-- Flash overlay -->
    <div v-if="flashOverlay" class="bt-flash" :style="{ background: flashOverlay.color }"></div>

    <!-- Header strip -->
    <header class="bt-header">
      <button class="bt-back" @click="exit">
        <Icon name="arrow-back" :size="16" />
      </button>
      <div class="bt-stage-info">
        <div class="bt-stage-id">CH.{{ stage.chapter }} · {{ stage.id }}</div>
        <div class="bt-stage-name">{{ stage.name }}</div>
      </div>
      <div class="bt-progress">
        <div class="bt-progress-segs">
          <span
            v-for="i in progress.battlesToClear" :key="i"
            class="bt-progress-seg"
            :class="i <= progress.battlesCompleted ? 'bt-progress-seg--done' : i === progress.battlesCompleted + 1 ? 'bt-progress-seg--active' : ''"
          ></span>
        </div>
        <div class="bt-turn">TURN <span>{{ battle.turn }}</span></div>
      </div>
    </header>

    <!-- ENEMY ARENA -->
    <section class="arena arena--enemy">
      <div class="arena-label">
        <span class="arena-label-dot"></span>
        <span>ENEMY</span>
        <span class="arena-label-count">{{ battle.enemies.filter(e => e.hp > 0).length }}/{{ battle.enemies.length }}</span>
      </div>
      <div class="unit-row unit-row--enemy">
        <button
          v-for="(e, idx) in battle.enemies" :key="idx"
          class="unit-frame unit-frame--enemy"
          :class="[
            e.hp === 0 ? 'unit-frame--fallen' : '',
            selectedTarget === e ? 'unit-frame--targeted' : '',
            `urf-${e.rarity}`
          ]"
          @click="pickTarget(e)"
          :disabled="e.hp === 0 || battleOver"
        >
          <div class="unit-frame-portrait">
            <img :src="portraitOf(e)" />
            <div class="unit-portrait-gradient"></div>
          </div>

          <!-- Skill flash -->
          <div
            v-for="f in skillFlashes.filter(fl => fl.unitRef === e)" :key="f.id"
            class="unit-skill-flash"
            :style="{ color: skillElementColor[f.element] || '#fff' }"
          ></div>
          <!-- Damage popups -->
          <span
            v-for="p in popups.filter(pp => pp.unitRef === e)" :key="p.id"
            class="damage-num"
            :class="[`dn-${p.kind}`, p.crit ? 'dn-crit' : '']"
          >
            {{ p.value > 0 ? '+' : '' }}{{ Math.abs(p.value) }}<span v-if="p.crit" class="dn-bang">!!</span>
          </span>

          <div class="unit-frame-badge">
            <span class="unit-rarity-badge" :class="`rarity-badge-${e.rarity}`">{{ e.rarity }}</span>
            <span class="unit-elem-badge" :class="`elem-${e.element}`"><Icon :name="e.element" :size="13" /></span>
          </div>
          <div class="unit-frame-lv">
            <span class="lv-label">Lv</span><span class="lv-num">{{ e.level }}</span>
          </div>

          <div class="unit-frame-bottom">
            <div class="unit-name">{{ e.name }}</div>
            <div class="hpbar">
              <div class="hpbar-fill" :style="{ width: (e.hp / e.hpMax * 100) + '%' }"></div>
              <span class="hpbar-num">{{ e.hp }}/{{ e.hpMax }}</span>
            </div>
            <div v-if="e.statusEffects.length" class="status-row">
              <span v-for="s in e.statusEffects" :key="s.status" class="status-chip">{{ s.status }}</span>
            </div>
          </div>

          <!-- Target indicator -->
          <div v-if="selectedTarget === e && e.hp > 0" class="targeted-indicator">
            <Icon name="play" :size="16" />
          </div>
        </button>
      </div>
    </section>

    <!-- LOG -->
    <section class="bt-log-section">
      <div ref="logRef" class="bt-log">
        <div v-for="(l, i) in battle.log.slice(-15)" :key="i" class="log-line" :class="{
          'log-line--damage': l.kind === 'damage',
          'log-line--heal': l.kind === 'heal',
          'log-line--skill': l.kind === 'skill',
          'log-line--status': l.kind === 'status' || l.kind === 'capture',
          'log-line--victory': l.kind === 'victory',
          'log-line--defeat': l.kind === 'defeat',
        }">{{ l.text }}</div>
      </div>
    </section>

    <!-- ALLY ARENA -->
    <section class="arena arena--ally">
      <div class="arena-label">
        <span class="arena-label-dot arena-label-dot--ally"></span>
        <span>PARTY</span>
        <span class="arena-label-count">{{ battle.allies.filter(a => a.hp > 0).length }}/{{ battle.allies.length }}</span>
      </div>
      <div class="unit-row unit-row--ally">
        <div
          v-for="(a, idx) in battle.allies" :key="idx"
          class="unit-frame unit-frame--ally"
          :class="[
            a.hp === 0 ? 'unit-frame--fallen' : '',
            a === activeAlly ? 'unit-frame--active' : '',
            `urf-${a.rarity}`
          ]"
        >
          <div class="unit-frame-portrait">
            <img :src="portraitOf(a, 'battle')" />
            <div class="unit-portrait-gradient"></div>
          </div>
          <div
            v-for="f in skillFlashes.filter(fl => fl.unitRef === a)" :key="f.id"
            class="unit-skill-flash"
            :style="{ color: skillElementColor[f.element] || '#fff' }"
          ></div>
          <span
            v-for="p in popups.filter(pp => pp.unitRef === a)" :key="p.id"
            class="damage-num"
            :class="[`dn-${p.kind}`, p.crit ? 'dn-crit' : '']"
          >
            {{ p.value > 0 ? '+' : '' }}{{ Math.abs(p.value) }}
          </span>
          <div class="unit-frame-badge">
            <span class="unit-rarity-badge" :class="`rarity-badge-${a.rarity}`">{{ a.rarity }}</span>
            <span class="unit-elem-badge" :class="`elem-${a.element}`"><Icon :name="a.element" :size="13" /></span>
          </div>
          <div class="unit-frame-lv">
            <span class="lv-label">Lv</span><span class="lv-num">{{ a.level }}</span>
          </div>
          <div class="unit-frame-bottom">
            <div class="unit-name">{{ a.name }}</div>
            <div class="hpbar">
              <div class="hpbar-fill" :style="{ width: (a.hp / a.hpMax * 100) + '%' }"></div>
              <span class="hpbar-num">{{ a.hp }}/{{ a.hpMax }}</span>
            </div>
            <div class="mpbar">
              <div class="mpbar-fill" :style="{ width: (a.mp / Math.max(1, a.mpMax) * 100) + '%' }"></div>
              <span class="mpbar-num">MP {{ a.mp }}/{{ a.mpMax }}</span>
            </div>
          </div>
          <div v-if="a === activeAlly && a.hp > 0" class="active-indicator">
            <Icon name="play" :size="16" />
          </div>
        </div>
      </div>
    </section>

    <!-- ACTION PANEL -->
    <section v-if="!battleOver" class="action-panel">
      <div v-if="activeAlly" class="action-inner">
        <div class="action-title">
          <span class="action-eyebrow">YOUR TURN</span>
          <span class="action-actor">{{ activeAlly.name }}</span>
          <span class="action-hint">の行動を選択</span>
        </div>

        <div class="skill-grid">
          <button
            v-for="s in usableSkills" :key="s.id"
            class="skill-tile"
            :class="[
              selectedSkillId === s.id ? 'skill-tile--selected' : '',
              !s.usable ? 'skill-tile--disabled' : '',
              `skill-tile--${s.element || 'neutral'}`
            ]"
            :disabled="!s.usable || animating"
            @click="pickSkill(s.id)"
          >
            <div class="skill-tile-icon">
              <Icon :name="skillIconFor(s)" :size="20" />
            </div>
            <div class="skill-tile-text">
              <div class="skill-tile-name">{{ s.name }}</div>
              <div class="skill-tile-desc">{{ s.description }}</div>
            </div>
            <div v-if="s.mpCost > 0" class="skill-tile-mp">
              <span>{{ s.mpCost }}</span><small>MP</small>
            </div>
          </button>
        </div>

        <div class="cmd-bar">
          <button class="cmd cmd--attack" :disabled="animating" @click="confirmAttack">
            <Icon name="sword" :size="20" />
            <span>技を使う</span>
          </button>
          <button class="cmd cmd--alt" :disabled="animating" @click="showCaptureMenu = !showCaptureMenu; showItemMenu = false">
            <Icon name="capture" :size="18" />
            <span>捕獲</span>
          </button>
          <button class="cmd cmd--alt" :disabled="animating" @click="showItemMenu = !showItemMenu; showCaptureMenu = false">
            <Icon name="flask" :size="18" />
            <span>道具</span>
          </button>
          <button class="cmd cmd--alt" :disabled="animating" @click="confirmFlee">
            <Icon name="flee" :size="18" />
            <span>逃走</span>
          </button>
        </div>

        <div v-if="showCaptureMenu" class="submenu animate-fade-in-up">
          <div class="submenu-target">
            <Icon name="capture" :size="14" />
            <span>対象: <b>{{ selectedTarget?.name ?? "未選択" }}</b></span>
          </div>
          <div class="submenu-items">
            <button v-for="i in captureItems" :key="i.id" class="submenu-item" @click="confirmCapture(i.id)">
              <Icon name="scroll" :size="14" />
              <span>{{ i.name }}</span>
              <span class="submenu-count">×{{ player.items[i.id] }}</span>
              <span v-if="selectedTarget" class="submenu-prob">{{ captureChance(selectedTarget, i.captureMultiplier ?? 1) }}%</span>
            </button>
            <span v-if="captureItems.length === 0" class="text-xs text-white/40">契約書がない</span>
          </div>
        </div>

        <div v-if="showItemMenu" class="submenu animate-fade-in-up">
          <div class="submenu-items">
            <button v-for="i in consumables" :key="i.id" class="submenu-item" @click="confirmItem(i.id)">
              <Icon name="flask" :size="14" />
              <span>{{ i.name }}</span>
              <span class="submenu-count">×{{ player.items[i.id] }}</span>
            </button>
            <span v-if="consumables.length === 0" class="text-xs text-white/40">道具がない</span>
          </div>
        </div>
      </div>
    </section>

    <!-- BATTLE OVER -->
    <div v-if="battleOver" class="result-overlay">
      <div class="result-card">
        <div class="result-banner" :class="battle.phase === 'end_victory' ? 'result--win' : 'result--lose'">
          <Icon v-if="battle.phase === 'end_victory'" name="crown" :size="32" />
          <Icon v-else name="lock" :size="32" />
          <span>{{ battle.phase === 'end_victory' ? 'VICTORY' : 'DEFEAT' }}</span>
        </div>
        <div v-if="rewardSummary && battle.phase === 'end_victory'" class="result-body">
          <div class="reward-row">
            <div class="reward-tile reward-tile--gold">
              <Icon name="gold" :size="28" />
              <div>
                <div class="reward-tile-label">GOLD</div>
                <div class="reward-tile-val">+{{ rewardSummary.gold }}</div>
              </div>
            </div>
            <div class="reward-tile reward-tile--exp">
              <Icon name="star" :size="28" />
              <div>
                <div class="reward-tile-label">EXP</div>
                <div class="reward-tile-val">+{{ rewardSummary.exp }}</div>
              </div>
            </div>
          </div>
          <div v-if="rewardSummary.captured" class="captured-banner">
            <Icon name="sparkle" :size="24" />
            <div>
              <div class="captured-banner-label">NEW MEMBER</div>
              <div class="captured-banner-name">{{ CHARACTERS_BY_ID[rewardSummary.captured.charId].name }} を仲間にした！</div>
              <RarityStars :rarity="CHARACTERS_BY_ID[rewardSummary.captured.charId].rarity" :size="13" />
            </div>
          </div>
          <div v-if="rewardSummary.events?.length" class="event-list">
            <div v-for="(ev, i) in rewardSummary.events" :key="i" class="event-row">
              <div class="event-name">{{ ev.name }}</div>
              <div v-for="(e, j) in ev.events" :key="j" class="event-line">
                <span v-if="e.type === 'levelup'" class="ev-up">↑ Lv {{ e.level }}</span>
                <span v-if="e.type === 'evolve'" class="ev-evo">★ 第{{ e.newStage }}形態に進化</span>
                <span v-if="e.type === 'skill_learned'" class="ev-skill">✦ 『{{ SKILLS[e.skillId]?.name }}』習得</span>
              </div>
            </div>
          </div>
        </div>
        <div class="result-actions">
          <template v-if="battle.phase === 'end_victory' && !stageDoneAfter()">
            <button class="cmd cmd--attack" @click="nextBattle">
              <Icon name="arrow-right" :size="18" />
              <span>次のバトル</span>
            </button>
            <button class="cmd cmd--alt" @click="exit">
              <Icon name="home" :size="16" />
              <span>退却</span>
            </button>
          </template>
          <template v-else>
            <button class="cmd cmd--attack" @click="exit">
              <Icon name="home" :size="18" />
              <span>{{ battle.phase === 'end_defeat' ? 'ホームへ戻る' : 'ステージ選択へ' }}</span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bt-root {
  min-height: 100vh;
  color: white;
  display: flex; flex-direction: column;
  padding-bottom: 1rem;
}
.bt-flash {
  position: absolute; inset: 0; z-index: 40;
  pointer-events: none;
  mix-blend-mode: screen;
  animation: bt-flash 0.3s ease-out;
}
@keyframes bt-flash {
  0% { opacity: 0; } 50% { opacity: 0.7; } 100% { opacity: 0; }
}

/* HEADER */
.bt-header {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.65rem 0.9rem;
  background: linear-gradient(180deg, rgba(15, 8, 30, 0.95), rgba(15, 8, 30, 0.55));
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 107, 157, 0.15);
  position: sticky; top: 0; z-index: 20;
}
.bt-back {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  color: white;
  transition: all 0.2s ease;
}
.bt-back:hover { background: rgba(255, 107, 157, 0.2); border-color: rgba(255, 107, 157, 0.5); }
.bt-stage-info { flex: 1; min-width: 0; }
.bt-stage-id {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.25em;
  color: rgba(255, 200, 230, 0.7);
}
.bt-stage-name {
  font-weight: 800;
  font-size: 1rem;
  margin-top: 1px;
}
.bt-progress { text-align: right; flex-shrink: 0; }
.bt-progress-segs { display: flex; gap: 3px; justify-content: flex-end; margin-bottom: 4px; }
.bt-progress-seg {
  width: 20px; height: 4px;
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
}
.bt-progress-seg--done { background: linear-gradient(90deg, #fbbf24, #f59e0b); box-shadow: 0 0 6px rgba(251,191,36,0.6); }
.bt-progress-seg--active { background: linear-gradient(90deg, #ff6b9d, #c34dff); box-shadow: 0 0 8px rgba(255,107,157,0.8); animation: pulse-seg 1.2s ease-in-out infinite; }
@keyframes pulse-seg { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
.bt-turn {
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.2em;
  color: rgba(255,255,255,0.5);
}
.bt-turn span { color: white; font-weight: 800; font-size: 14px; }

/* ARENA */
.arena { padding: 0.5rem 0.85rem; }
.arena-label {
  display: flex; align-items: center; gap: 0.5rem;
  font-family: 'Orbitron', monospace;
  font-size: 10px;
  letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.65);
  margin-bottom: 0.5rem;
  padding-left: 0.25rem;
}
.arena-label-dot {
  width: 6px; height: 6px;
  background: #f87171;
  border-radius: 50%;
  box-shadow: 0 0 8px #f87171;
}
.arena-label-dot--ally { background: #60a5fa; box-shadow: 0 0 8px #60a5fa; }
.arena-label-count {
  margin-left: auto;
  color: rgba(255,255,255,0.5);
  font-size: 11px;
}

.unit-row {
  display: flex; gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* UNIT FRAME (chess-piece style) */
.unit-frame {
  position: relative;
  width: 150px;
  background: linear-gradient(180deg, rgba(31, 21, 56, 0.95), rgba(15, 8, 30, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(.2,.9,.3,1.4);
  /* hexagonal-ish clip */
  clip-path: polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px));
}
.unit-frame--ally { width: 170px; }
.unit-frame:hover:not(:disabled):not(.unit-frame--fallen) {
  transform: translateY(-3px) scale(1.02);
  border-color: rgba(255, 200, 230, 0.5);
}
.unit-frame--targeted {
  border-color: #f87171 !important;
  box-shadow: 0 0 0 2px rgba(248, 113, 113, 0.7), 0 0 24px rgba(248, 113, 113, 0.5);
  animation: target-pulse 1s ease-in-out infinite;
}
@keyframes target-pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(248, 113, 113, 0.7), 0 0 24px rgba(248, 113, 113, 0.45); }
  50% { box-shadow: 0 0 0 2.5px rgba(248, 113, 113, 1), 0 0 32px rgba(248, 113, 113, 0.75); }
}
.unit-frame--active {
  border-color: #60a5fa !important;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.7), 0 0 24px rgba(96, 165, 250, 0.5);
  animation: active-pulse 1.2s ease-in-out infinite;
}
@keyframes active-pulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.7), 0 0 20px rgba(96, 165, 250, 0.45); }
  50% { box-shadow: 0 0 0 2.5px rgba(96, 165, 250, 1), 0 0 30px rgba(96, 165, 250, 0.7); }
}
.unit-frame--fallen { filter: grayscale(0.8) brightness(0.55); transform: rotate(-2deg); opacity: 0.7; }

/* Rarity-tinted unit frame */
.urf-N { border-color: rgba(148,163,184,0.4); }
.urf-R { border-color: rgba(96,165,250,0.6); box-shadow: 0 0 10px rgba(96,165,250,0.25); }
.urf-SR { border-color: rgba(192,132,252,0.7); box-shadow: 0 0 14px rgba(192,132,252,0.35); }
.urf-SSR { border-color: rgba(251,191,36,0.8); box-shadow: 0 0 18px rgba(251,191,36,0.4); }
.urf-UR { border-color: rgba(248,113,113,0.85); box-shadow: 0 0 22px rgba(248,113,113,0.5); }

.unit-frame-portrait {
  position: relative;
  width: 100%; aspect-ratio: 3/4;
  overflow: hidden;
}
.unit-frame-portrait img {
  width: 100%; height: 100%; object-fit: cover;
  filter: contrast(1.08) saturate(1.15);
}
.unit-portrait-gradient {
  position: absolute; inset: auto 0 0 0; height: 50%;
  background: linear-gradient(to top, rgba(14,8,28,0.95) 0%, rgba(14,8,28,0.4) 60%, transparent 100%);
}

.unit-frame-badge {
  position: absolute; top: 6px; left: 6px;
  display: flex; gap: 3px; z-index: 5;
}
.unit-rarity-badge {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  font-weight: 900;
  padding: 2px 5px;
  border-radius: 3px;
  letter-spacing: 0.05em;
  color: white;
  text-shadow: 0 1px 1px rgba(0,0,0,0.6);
}
.rarity-badge-N { background: linear-gradient(135deg, #94a3b8, #475569); }
.rarity-badge-R { background: linear-gradient(135deg, #60a5fa, #1d4ed8); }
.rarity-badge-SR { background: linear-gradient(135deg, #c084fc, #7c3aed); }
.rarity-badge-SSR { background: linear-gradient(135deg, #fbbf24, #d97706); }
.rarity-badge-UR { background: linear-gradient(135deg, #f87171, #be123c); animation: ur-glow 2s ease-in-out infinite; }
@keyframes ur-glow { 0%,100% { box-shadow: 0 0 6px rgba(248,113,113,0.7); } 50% { box-shadow: 0 0 14px rgba(251,191,36,0.9); } }

.unit-elem-badge {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
}
.elem-fire   { background: linear-gradient(135deg, #ff8c42, #c2410c); box-shadow: 0 0 8px rgba(249, 115, 22, 0.6); }
.elem-water  { background: linear-gradient(135deg, #38bdf8, #1d4ed8); box-shadow: 0 0 8px rgba(56, 189, 248, 0.6); }
.elem-wood   { background: linear-gradient(135deg, #4ade80, #15803d); box-shadow: 0 0 8px rgba(74, 222, 128, 0.6); }
.elem-light  { background: linear-gradient(135deg, #fde68a, #d97706); box-shadow: 0 0 8px rgba(253, 230, 138, 0.7); }
.elem-dark   { background: linear-gradient(135deg, #c084fc, #4c1d95); box-shadow: 0 0 8px rgba(192, 132, 252, 0.6); }

.unit-frame-lv {
  position: absolute; top: 6px; right: 6px;
  display: flex; align-items: baseline; gap: 2px;
  padding: 2px 6px;
  background: rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 4px;
  z-index: 5;
}
.lv-label {
  font-family: 'Orbitron', monospace;
  font-size: 8px;
  color: rgba(255,255,255,0.7);
}
.lv-num {
  font-family: 'Orbitron', monospace;
  font-size: 14px;
  font-weight: 900;
  color: #fde047;
  text-shadow: 0 0 6px rgba(253,224,71,0.7);
}

.unit-frame-bottom {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 0.4rem 0.55rem;
  z-index: 5;
}
.unit-name {
  font-size: 11px; font-weight: 800; color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.7);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 3px;
}
.hpbar, .mpbar {
  position: relative;
  height: 8px;
  background: rgba(0,0,0,0.7);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 2px;
}
.mpbar { height: 5px; }
.hpbar-fill {
  position: absolute; top: 0; left: 0; bottom: 0;
  background: linear-gradient(90deg, #f87171, #dc2626);
  box-shadow: 0 0 6px rgba(248, 113, 113, 0.7);
  transition: width 0.4s ease;
}
.mpbar-fill {
  position: absolute; top: 0; left: 0; bottom: 0;
  background: linear-gradient(90deg, #60a5fa, #1d4ed8);
  box-shadow: 0 0 6px rgba(96, 165, 250, 0.7);
  transition: width 0.4s ease;
}
.hpbar-num, .mpbar-num {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Orbitron', monospace;
  font-size: 8px;
  font-weight: 700;
  color: white;
  text-shadow: 0 0 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1);
}
.mpbar-num { font-size: 7px; }

.status-row { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 2px; }
.status-chip {
  font-size: 8px;
  padding: 1px 5px;
  background: rgba(252, 211, 77, 0.3);
  border: 1px solid rgba(252, 211, 77, 0.5);
  border-radius: 6px;
  color: #fde68a;
  text-transform: uppercase;
}

.targeted-indicator {
  position: absolute;
  top: -10px; left: 50%; transform: translateX(-50%) rotate(180deg);
  width: 24px; height: 24px;
  background: #f87171;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  color: white;
  box-shadow: 0 0 12px rgba(248, 113, 113, 0.8);
  animation: bob 0.8s ease-in-out infinite;
  z-index: 10;
}
.active-indicator {
  position: absolute;
  top: -10px; left: 50%; transform: translateX(-50%);
  width: 24px; height: 24px;
  background: #60a5fa;
  border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  color: white;
  box-shadow: 0 0 12px rgba(96, 165, 250, 0.8);
  animation: bob 0.8s ease-in-out infinite;
  z-index: 10;
}
@keyframes bob {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-4px); }
}
.targeted-indicator { animation: bob-down 0.8s ease-in-out infinite; }
@keyframes bob-down {
  0%, 100% { transform: translateX(-50%) rotate(180deg) translateY(0); }
  50% { transform: translateX(-50%) rotate(180deg) translateY(-4px); }
}

/* Damage popup */
.damage-num {
  position: absolute;
  top: 30%; left: 50%;
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 1.5rem;
  pointer-events: none;
  z-index: 30;
  transform: translate(-50%, -50%);
  animation: float-up 1.3s cubic-bezier(.2,.7,.2,1) forwards;
  text-shadow: 0 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 12px currentColor;
}
.dn-crit { font-size: 2.3rem; }
.dn-bang { color: #fde047; }
.dn-physical { color: #fde047; }
.dn-fire { color: #ff8c42; }
.dn-water { color: #60a5fa; }
.dn-wood { color: #4ade80; }
.dn-light { color: #fef3c7; }
.dn-dark { color: #c084fc; }
.dn-heal { color: #6ee7b7; }
@keyframes float-up {
  0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
  15% { transform: translate(-50%, -70%) scale(1.3); opacity: 1; }
  100% { transform: translate(-50%, -150%) scale(1); opacity: 0; }
}

.unit-skill-flash {
  position: absolute; inset: -15%;
  background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, currentColor 35%, transparent 70%);
  border-radius: 50%;
  mix-blend-mode: screen;
  animation: skill-burst 0.8s ease-out forwards;
  pointer-events: none;
  z-index: 8;
}
@keyframes skill-burst {
  0% { transform: scale(0); opacity: 0; }
  30% { transform: scale(1.5); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}

/* LOG */
.bt-log-section { padding: 0 0.85rem; margin: 0.5rem 0; }
.bt-log {
  max-height: 100px;
  overflow-y: auto;
  padding: 0.55rem 0.85rem;
  background: linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.4));
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 6px;
  backdrop-filter: blur(6px);
  font-family: 'M PLUS Rounded 1c', monospace;
  font-size: 11px;
  line-height: 1.7;
}
.bt-log::-webkit-scrollbar { width: 5px; }
.bt-log::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
.log-line { color: rgba(255,255,255,0.75); }
.log-line--damage { color: #fca5a5; }
.log-line--heal { color: #6ee7b7; }
.log-line--skill { color: #f9a8d4; font-weight: 700; }
.log-line--status { color: #fde68a; }
.log-line--victory { color: #6ee7b7; font-weight: 800; }
.log-line--defeat { color: #fb7185; font-weight: 800; }

/* ACTION PANEL */
.action-panel {
  margin: 0.5rem 0.85rem 0;
  padding: 0.85rem;
  background: linear-gradient(180deg, rgba(31, 21, 56, 0.95), rgba(15, 8, 30, 0.98));
  border: 1px solid rgba(255, 200, 230, 0.15);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  box-shadow: 0 -4px 24px rgba(0,0,0,0.4);
}
.action-title {
  display: flex; align-items: baseline; gap: 0.5rem;
  margin-bottom: 0.65rem;
}
.action-eyebrow {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.3em;
  color: rgba(255, 200, 230, 0.7);
  padding: 2px 6px;
  background: rgba(255, 107, 157, 0.15);
  border-radius: 3px;
}
.action-actor {
  font-weight: 800;
  font-size: 0.95rem;
  background: linear-gradient(135deg, #ffacd0, #ff6b9d);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.action-hint { color: rgba(255,255,255,0.5); font-size: 0.75rem; }

.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 0.4rem;
  margin-bottom: 0.7rem;
}
.skill-tile {
  display: flex; align-items: center; gap: 0.55rem;
  padding: 0.55rem 0.65rem;
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  text-align: left;
  transition: all 0.2s ease;
  cursor: pointer;
}
.skill-tile:hover:not(:disabled) {
  background: rgba(255,107,157,0.15);
  border-color: rgba(255,107,157,0.5);
  transform: translateY(-1px);
}
.skill-tile--selected {
  background: linear-gradient(135deg, rgba(255,107,157,0.28), rgba(157,107,255,0.22));
  border-color: #ff6b9d;
  box-shadow: 0 0 14px rgba(255,107,157,0.5);
}
.skill-tile--disabled { opacity: 0.35; cursor: not-allowed; }
.skill-tile-icon {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.4);
  border-radius: 5px;
  flex-shrink: 0;
}
.skill-tile--fire .skill-tile-icon { color: #ff8c42; }
.skill-tile--water .skill-tile-icon { color: #60a5fa; }
.skill-tile--wood .skill-tile-icon { color: #4ade80; }
.skill-tile--light .skill-tile-icon { color: #fde68a; }
.skill-tile--dark .skill-tile-icon { color: #c084fc; }
.skill-tile-text { flex: 1; min-width: 0; }
.skill-tile-name { font-size: 0.85rem; font-weight: 700; color: white; }
.skill-tile-desc {
  font-size: 9.5px;
  color: rgba(255,255,255,0.55);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.skill-tile-mp {
  flex-shrink: 0;
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  color: #60a5fa;
  font-size: 1.05rem;
  text-shadow: 0 0 6px rgba(96,165,250,0.6);
}
.skill-tile-mp small { font-size: 8px; color: rgba(255,255,255,0.4); margin-left: 1px; }

/* Command bar */
.cmd-bar { display: flex; gap: 0.4rem; flex-wrap: wrap; }
.cmd {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.6rem 1rem;
  border: 1px solid;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  clip-path: polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px);
}
.cmd--attack {
  flex: 2;
  background: linear-gradient(135deg, #ff6b9d 0%, #c34dff 100%);
  border-color: transparent;
  color: white;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.5);
}
.cmd--attack:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(255, 107, 157, 0.7);
}
.cmd--alt {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.9);
}
.cmd--alt:hover:not(:disabled) {
  background: rgba(255, 107, 157, 0.18);
  border-color: rgba(255, 107, 157, 0.45);
}
.cmd:disabled { opacity: 0.4; cursor: not-allowed; }

/* Submenu */
.submenu {
  margin-top: 0.55rem;
  padding: 0.55rem 0.65rem;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 6px;
}
.submenu-target {
  display: flex; align-items: center; gap: 0.4rem;
  font-size: 0.78rem;
  color: rgba(255, 200, 230, 0.7);
  margin-bottom: 0.4rem;
}
.submenu-target b { color: white; }
.submenu-items { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.submenu-item {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 4px;
  font-size: 11px;
  transition: all 0.2s ease;
}
.submenu-item:hover {
  background: rgba(255, 107, 157, 0.2);
  border-color: rgba(255, 107, 157, 0.5);
}
.submenu-count { color: rgba(255,255,255,0.5); }
.submenu-prob { color: #fde047; font-weight: 700; }

/* RESULT OVERLAY */
.result-overlay {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(0,0,0,0.85);
  backdrop-filter: blur(14px);
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}
.result-card {
  max-width: 480px; width: 100%;
  background: linear-gradient(180deg, rgba(31, 21, 56, 0.98), rgba(10, 5, 20, 0.98));
  border: 1px solid rgba(255, 107, 157, 0.5);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(255, 107, 157, 0.35);
  animation: result-in 0.6s cubic-bezier(.2,.9,.3,1.2);
}
@keyframes result-in {
  0% { opacity: 0; transform: scale(0.85) translateY(20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.result-banner {
  display: flex; align-items: center; justify-content: center; gap: 0.85rem;
  padding: 1.5rem 1rem;
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 2rem;
  letter-spacing: 0.2em;
  text-shadow: 0 0 24px currentColor;
}
.result--win {
  color: #6ee7b7;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(5, 150, 105, 0.2));
  border-bottom: 1px solid rgba(110, 231, 183, 0.35);
}
.result--lose {
  color: #fb7185;
  background: linear-gradient(135deg, rgba(225, 29, 72, 0.35), rgba(159, 18, 57, 0.2));
  border-bottom: 1px solid rgba(251, 113, 133, 0.35);
}

.result-body { padding: 1rem 1.25rem; }
.reward-row { display: flex; gap: 0.65rem; margin-bottom: 0.85rem; }
.reward-tile {
  flex: 1;
  display: flex; align-items: center; gap: 0.7rem;
  padding: 0.7rem 0.95rem;
  border: 1px solid;
  border-radius: 8px;
}
.reward-tile--gold {
  background: linear-gradient(135deg, rgba(251,191,36,0.2), rgba(180,83,9,0.15));
  border-color: rgba(251,191,36,0.5);
  color: #fde68a;
}
.reward-tile--exp {
  background: linear-gradient(135deg, rgba(96,165,250,0.2), rgba(29,78,216,0.15));
  border-color: rgba(96,165,250,0.5);
  color: #bfdbfe;
}
.reward-tile-label {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.25em;
  color: rgba(255,255,255,0.5);
}
.reward-tile-val {
  font-family: 'Orbitron', monospace;
  font-size: 1.5rem;
  font-weight: 900;
  text-shadow: 0 0 12px currentColor;
}

.captured-banner {
  display: flex; align-items: center; gap: 0.85rem;
  padding: 0.85rem;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(192, 38, 211, 0.15));
  border: 1px solid rgba(236, 72, 153, 0.5);
  border-radius: 8px;
  color: #f9a8d4;
  margin-bottom: 0.85rem;
  box-shadow: 0 0 14px rgba(236, 72, 153, 0.3);
}
.captured-banner-label {
  font-family: 'Orbitron', monospace;
  font-size: 9px;
  letter-spacing: 0.25em;
  color: rgba(255,255,255,0.6);
}
.captured-banner-name {
  font-weight: 800;
  color: white;
  margin: 1px 0;
}

.event-list { display: flex; flex-direction: column; gap: 0.4rem; }
.event-row {
  padding: 0.55rem 0.75rem;
  background: rgba(0,0,0,0.35);
  border-left: 3px solid #ff6b9d;
  border-radius: 4px;
}
.event-name { font-weight: 800; font-size: 0.85rem; margin-bottom: 2px; }
.event-line { font-size: 11px; }
.ev-up { color: #6ee7b7; }
.ev-evo { color: #f9a8d4; font-weight: 700; }
.ev-skill { color: #fde68a; }

.result-actions {
  display: flex; gap: 0.5rem; justify-content: center;
  padding: 1rem 1.25rem 1.25rem;
}
</style>
