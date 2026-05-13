<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { saveAdapter, type SignInMode } from "../save/adapter";
import { usePlayerStore } from "../stores/player";
import ScenicBackground from "../components/ScenicBackground.vue";
import Icon from "../components/Icon.vue";

const router = useRouter();
const player = usePlayerStore();
const busy = ref(false);
const errorMsg = ref("");

async function start(mode: SignInMode = "google") {
  busy.value = true;
  errorMsg.value = "";
  try {
    const { uid, displayName } = await saveAdapter.signIn(mode);
    await player.initialize(uid, displayName);
    router.replace({ name: "home" });
  } catch (e: any) {
    errorMsg.value = e?.message ?? "ログインに失敗しました";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="title-root">
    <ScenicBackground scene="cityscape" />

    <div class="title-vignette"></div>

    <main class="title-stage">
      <!-- Side rail labels -->
      <div class="rail rail-left">
        <span class="rail-line"></span>
        <span class="rail-text">CHAPTER ZERO</span>
        <span class="rail-line"></span>
      </div>
      <div class="rail rail-right">
        <span class="rail-line"></span>
        <span class="rail-text">VERSION 0.1.0</span>
        <span class="rail-line"></span>
      </div>

      <div class="title-content">
        <div class="title-tagline">
          <span class="line"></span>
          <span class="tagline-text">APARTMENT × BISHOUJO</span>
          <span class="line"></span>
        </div>

        <h1 class="title-h1">
          <span class="title-row title-row-1">ハートフル</span>
          <span class="title-row title-row-2">ゴリオン</span>
        </h1>

        <div class="title-sub">
          <span class="sub-bracket">［</span>
          <span class="sub-text">仮 / WORKING TITLE</span>
          <span class="sub-bracket">］</span>
        </div>

        <p class="title-flavor">
          全国のアパートから生まれた美少女50人、<br>
          住人たちと出会い、絆を結び、住処を築く物語。
        </p>

        <div class="title-actions">
          <button class="action-btn action-btn--primary" :disabled="busy" @click="start('google')">
            <span class="btn-shine"></span>
            <Icon name="google" :size="18" />
            <span>{{ busy ? "接続中..." : "Googleでログイン" }}</span>
            <Icon name="arrow-right" :size="14" />
          </button>
          <button class="action-btn action-btn--secondary" :disabled="busy" @click="start('anonymous')">
            <Icon name="guest" :size="16" />
            <span>ゲストとしてプレイ</span>
          </button>
        </div>

        <div class="title-status">
          <Icon v-if="saveAdapter.isFirebase" name="cloud" :size="12" />
          <Icon v-else name="save" :size="12" />
          <span>{{ saveAdapter.isFirebase ? "CLOUD SAVE READY" : "LOCAL SAVE ONLY" }}</span>
        </div>

        <p v-if="errorMsg" class="title-error">
          <Icon name="lock" :size="12" />
          {{ errorMsg }}
        </p>
      </div>

      <div class="title-footer">
        <span>© 2026 APARTMENT BISHOUJO PROJECT</span>
        <span class="dot">·</span>
        <span>50 CHARS</span>
        <span class="dot">·</span>
        <span>5 CHAPTERS</span>
      </div>
    </main>
  </div>
</template>

<style scoped>
.title-root {
  position: fixed;
  inset: 0;
  overflow: hidden;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}
.title-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at 50% 60%, transparent 0%, rgba(10, 4, 24, 0.5) 70%);
  pointer-events: none;
  z-index: 1;
}

.title-stage {
  position: relative; z-index: 2;
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  padding: 2.5vh 4vw;
}

.rail {
  position: absolute;
  top: 50%; transform: translateY(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 0.65rem;
  opacity: 0.65;
}
.rail-left { left: 1.5vw; }
.rail-right { right: 1.5vw; }
.rail-line {
  width: 1px;
  height: 7vh;
  background: linear-gradient(to bottom, transparent, rgba(255, 200, 230, 0.5), transparent);
}
.rail-text {
  font-family: 'Orbitron', monospace;
  font-size: clamp(8px, 0.7vw, 10px);
  letter-spacing: 0.35em;
  color: rgba(255, 200, 230, 0.8);
  writing-mode: vertical-rl;
  text-orientation: mixed;
}
@media (max-width: 768px) { .rail { display: none; } }

.title-content {
  display: flex; flex-direction: column; align-items: center;
  gap: clamp(0.7rem, 1.6vh, 1.1rem);
  text-align: center;
  max-width: 720px;
  animation: stage-in 1.1s cubic-bezier(.2,.9,.3,1.2) backwards;
}
@keyframes stage-in {
  from { opacity: 0; transform: translateY(30px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.title-tagline {
  display: flex; align-items: center; gap: 0.85rem;
  width: 100%; max-width: 460px;
}
.line {
  flex: 1; height: 1px;
  background: linear-gradient(to right, transparent, rgba(255, 200, 230, 0.55), transparent);
}
.tagline-text {
  font-family: 'Orbitron', monospace;
  font-size: clamp(9px, 1vw, 11px);
  letter-spacing: 0.4em;
  color: rgba(255, 200, 230, 0.9);
  text-shadow: 0 0 12px rgba(255, 107, 157, 0.6);
}

.title-h1 {
  margin: 0;
  line-height: 0.92;
  letter-spacing: 0.04em;
  filter: drop-shadow(0 4px 24px rgba(0,0,0,0.7)) drop-shadow(0 0 28px rgba(255, 107, 157, 0.4));
}
.title-row {
  display: block;
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 900;
  font-size: clamp(44px, 8.5vw, 86px);
}
.title-row-1 {
  background: linear-gradient(180deg, #ffffff 0%, #ffe4f0 60%, #ffacd0 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}
.title-row-2 {
  background: linear-gradient(180deg, #ffd6a8 0%, #ff6b9d 50%, #c34dff 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}

.title-sub {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  margin-top: -0.4rem;
}
.sub-bracket { color: rgba(255, 107, 157, 0.7); font-size: 1.2rem; }
.sub-text {
  font-family: 'Orbitron', monospace;
  font-size: clamp(9px, 0.9vw, 11px);
  letter-spacing: 0.4em;
  color: rgba(255, 220, 240, 0.7);
}

.title-flavor {
  color: rgba(255, 255, 255, 0.7);
  font-size: clamp(12px, 1.1vw, 14px);
  line-height: 1.8;
  max-width: 460px;
  margin: 0;
}

.title-actions {
  display: flex; flex-direction: column; gap: 0.55rem; align-items: center;
  width: 100%; max-width: 320px;
}
.action-btn {
  position: relative;
  display: flex; align-items: center; justify-content: center; gap: 0.6rem;
  width: 100%;
  padding: 0.85rem 1.15rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  font-size: clamp(13px, 1vw, 15px);
  transition: all 0.25s ease;
  overflow: hidden;
  border: 1px solid transparent;
  clip-path: polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px);
}
.action-btn--primary {
  background: linear-gradient(135deg, #ff6b9d 0%, #c34dff 100%);
  color: white;
  box-shadow: 0 6px 24px rgba(255, 107, 157, 0.5), 0 1px 0 rgba(255,255,255,0.3) inset;
}
.action-btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.1);
  box-shadow: 0 10px 32px rgba(255, 107, 157, 0.7);
}
.btn-shine {
  position: absolute; top: 50%; left: -100%;
  width: 100%; height: 200%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transform: translateY(-50%) rotate(15deg);
  transition: left 0.6s ease;
}
.action-btn--primary:hover:not(:disabled) .btn-shine { left: 200%; }
.action-btn--secondary {
  background: linear-gradient(135deg, rgba(31, 21, 56, 0.85), rgba(42, 28, 74, 0.85));
  backdrop-filter: blur(12px);
  border-color: rgba(255, 200, 230, 0.3);
  color: rgba(255, 220, 240, 0.95);
}
.action-btn--secondary:hover:not(:disabled) {
  border-color: rgba(255, 107, 157, 0.6);
  background: linear-gradient(135deg, rgba(48, 32, 80, 0.85), rgba(60, 40, 100, 0.85));
}
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.title-status {
  display: inline-flex; align-items: center; gap: 0.35rem;
  font-family: 'Orbitron', monospace;
  font-size: clamp(8px, 0.7vw, 10px);
  letter-spacing: 0.25em;
  color: rgba(255, 220, 240, 0.55);
}

.title-error {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  background: rgba(225, 29, 72, 0.2);
  border: 1px solid rgba(251, 113, 133, 0.4);
  border-radius: 4px;
  font-size: 0.8rem;
  color: #fca5a5;
  margin: 0;
}

.title-footer {
  position: absolute;
  bottom: 1.2vh; left: 50%;
  transform: translateX(-50%);
  display: flex; gap: 0.85rem; align-items: center;
  font-family: 'Orbitron', monospace;
  font-size: clamp(7px, 0.65vw, 9px);
  letter-spacing: 0.3em;
  color: rgba(255, 220, 240, 0.35);
  white-space: nowrap;
}
.dot { color: rgba(255, 107, 157, 0.6); }
</style>
