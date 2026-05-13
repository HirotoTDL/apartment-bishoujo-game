<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { saveAdapter, type SignInMode } from "../save/adapter";
import { usePlayerStore } from "../stores/player";
import AnimatedBackground from "../components/AnimatedBackground.vue";

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
  <div class="title-root min-h-screen w-full flex flex-col items-center justify-center text-white px-6 py-10 relative overflow-hidden">
    <AnimatedBackground variant="rose" intensity="high" />

    <!-- Decorative glow rays -->
    <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
      <div class="title-rays"></div>
    </div>

    <div class="title-container text-center max-w-2xl relative z-10 animate-fade-in-up">
      <!-- Logo / title -->
      <div class="title-emblem mx-auto mb-6">
        <div class="title-emblem-inner">
          <span class="text-5xl">💗</span>
        </div>
      </div>

      <h1 class="title-main h-title mb-1">
        <span class="block text-6xl md:text-7xl tracking-wider">ハートフル</span>
        <span class="block text-6xl md:text-7xl tracking-wider title-main-grad">ゴリオン</span>
        <span class="block text-base md:text-lg text-pink-200 font-light tracking-[0.4em] mt-2">(仮)</span>
      </h1>
      <p class="text-pink-200/90 text-base md:text-lg tracking-[0.3em] mt-3 mb-1 font-tech">
        APARTMENT × BISHOUJO COLLECTION
      </p>
      <p class="text-white/60 my-6 leading-relaxed text-sm md:text-base max-w-lg mx-auto">
        全国のアパート名から生まれた美少女たちと出会い、戦い、仲間にしよう。<br>
        50人のキャラクターが住む街で、<span class="text-pink-300 font-bold">あなたの理想の住まい</span>を築く物語。
      </p>

      <!-- Auth buttons -->
      <div class="space-y-3 mt-8">
        <button class="btn-google w-72 text-base mx-auto" :disabled="busy" @click="start('google')">
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29 35.4 26.6 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.2 5.2C40.7 35.6 44 30.3 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
          <span>{{ busy ? "読み込み中..." : "Googleでログイン" }}</span>
        </button>
        <button class="btn-secondary w-72 text-sm mx-auto block" :disabled="busy" @click="start('anonymous')">
          {{ busy ? "..." : "👤 ゲストとしてプレイ" }}
        </button>

        <p v-if="!saveAdapter.isFirebase" class="text-xs text-yellow-200 mt-3">
          ⚠️ ローカル保存モード — Firebase設定でクラウドセーブが有効化されます
        </p>
        <p v-else class="text-xs text-white/45 mt-3">
          ☁ クラウドセーブ有効 — 複数端末でセーブ共有可能
        </p>
        <p v-if="errorMsg" class="text-red-300 text-sm mt-3 panel p-3 inline-block">{{ errorMsg }}</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="absolute bottom-4 text-xs text-white/30 tracking-widest text-center z-10">
      <span class="font-tech">© 2026 APARTMENT BISHOUJO PROJECT</span>
      <span class="mx-3">·</span>
      <span>キャラクター画像は順次更新</span>
    </div>
  </div>
</template>

<style scoped>
.title-root {
  perspective: 1200px;
}

.title-emblem {
  width: 96px; height: 96px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff4ec 0%, #ff9bbf 40%, #c34dff 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 32px rgba(255, 107, 157, 0.8), 0 0 64px rgba(195, 77, 255, 0.5), 0 8px 32px rgba(0,0,0,0.5), 0 0 0 4px rgba(255,255,255,0.2) inset;
  animation: emblem-pulse 3s ease-in-out infinite;
}
.title-emblem-inner {
  width: 80px; height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b9d, #c34dff);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(255, 107, 157, 0.6) inset, 0 0 24px rgba(255, 107, 157, 0.5);
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
}
@keyframes emblem-pulse {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.06); filter: brightness(1.15); }
}

.title-main {
  line-height: 0.95;
  filter: drop-shadow(0 4px 20px rgba(0,0,0,0.6));
}
.title-main-grad {
  background: linear-gradient(180deg, #fff8ff 0%, #ffe4f0 30%, #ffacd0 60%, #ff6b9d 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 24px rgba(255, 107, 157, 0.7));
}

.title-rays {
  width: 800px; height: 800px;
  background: conic-gradient(from 0deg, transparent 0deg, rgba(255, 107, 157, 0.12) 10deg, transparent 30deg, rgba(195, 77, 255, 0.1) 40deg, transparent 60deg, rgba(255, 107, 157, 0.12) 100deg, transparent 130deg, rgba(195, 77, 255, 0.08) 160deg, transparent 200deg, rgba(255, 107, 157, 0.1) 230deg, transparent 260deg, rgba(195, 77, 255, 0.12) 300deg, transparent 330deg);
  animation: rays-rotate 60s linear infinite;
  filter: blur(20px);
  opacity: 0.7;
}
@keyframes rays-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.title-container {
  animation: title-rise 1.2s cubic-bezier(.2,.9,.3,1.2) backwards;
}
@keyframes title-rise {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
