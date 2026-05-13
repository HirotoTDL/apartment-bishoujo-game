<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { usePlayerStore } from "./stores/player";
import ScaleToFit from "./components/ScaleToFit.vue";

const router = useRouter();
const route = useRoute();
const player = usePlayerStore();

// Guard: any route except "/" requires player to be initialised
function guard() {
  if (!player.ready && route.name !== "title") {
    router.replace({ name: "title" });
  }
}

onMounted(guard);
watch(() => route.name, guard);

// Auto-save when dirty (throttled)
let saveTimer: number | null = null;
watch(
  () => player.isDirty,
  d => {
    if (d) {
      if (saveTimer) window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        player.persist();
      }, 4000);
    }
  }
);
</script>

<template>
  <ScaleToFit :design-width="1280" :design-height="720">
    <router-view />
  </ScaleToFit>
</template>
