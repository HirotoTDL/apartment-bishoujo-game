<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { saveAdapter } from "../save/adapter";
import { usePlayerStore } from "../stores/player";

const router = useRouter();
const player = usePlayerStore();
const busy = ref(false);
const errorMsg = ref("");

async function start() {
  busy.value = true;
  errorMsg.value = "";
  try {
    const { uid, displayName } = await saveAdapter.signIn();
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
  <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900 text-white p-6">
    <div class="text-center max-w-2xl">
      <h1 class="text-5xl md:text-6xl font-black mb-2 drop-shadow-glow tracking-wider">
        ハートフルゴリオン(仮)
      </h1>
      <p class="text-pink-200 text-lg mb-2 tracking-widest">— Apartment Bishoujo Collection —</p>
      <p class="text-white/70 my-6 leading-relaxed">
        全国のアパート名から生まれた美少女たちと出会い、戦い、仲間にしよう。<br>
        50人のキャラクターが住む街で、あなたの理想の住まいを築く物語。
      </p>
      <div class="space-y-3">
        <button class="btn w-64 text-lg" :disabled="busy" @click="start">
          {{ busy ? "読み込み中..." : "▶ はじめる / 続きから" }}
        </button>
        <p v-if="!saveAdapter.isFirebase" class="text-xs text-yellow-200">
          ※ ローカル保存モード(端末固有のセーブ)。クラウドセーブを有効にするには Firebase 設定が必要です。
        </p>
        <p v-if="errorMsg" class="text-red-300 text-sm">{{ errorMsg }}</p>
      </div>
    </div>
    <div class="mt-12 text-xs text-white/40 text-center">
      キャラクター画像は順次差し替え予定 / © Apartment Bishoujo Project
    </div>
  </div>
</template>

<style scoped>
.drop-shadow-glow {
  text-shadow: 0 0 24px rgba(255, 107, 157, 0.6), 0 4px 12px rgba(0,0,0,0.5);
}
</style>
