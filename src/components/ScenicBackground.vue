<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(defineProps<{
  scene?: "cityscape" | "lobby" | "arena" | "map" | "archive" | "shop" | "sanctuary";
}>(), {
  scene: "cityscape",
});

/**
 * Map each scene id to its image filename.
 * Real images live under {BASE_URL}assets/bg/{filename}.
 * If an image fails to load (404 or build issue), `useFallback` flips to
 * true and the procedurally-generated SVG scene is rendered instead.
 */
const SCENE_FILE: Record<string, string> = {
  cityscape: "title_cityscape.jpg",
  lobby: "home_lobby.jpg",
  arena: "battle_arena.jpg",
  map: "stages_map.jpg",
  archive: "dex_archive.jpg",
  shop: "shop_market.jpg",
  sanctuary: "party_sanctuary.jpg",
};

const base = (import.meta as any).env.BASE_URL || "/";
const imgSrc = computed(() => `${base}assets/bg/${SCENE_FILE[props.scene] ?? "title_cityscape.jpg"}`);
const useFallback = ref(false);
function onError() { useFallback.value = true; }
</script>

<template>
  <div class="scenic-bg">
    <!-- Primary: real bitmap scene art -->
    <img
      v-if="!useFallback"
      :src="imgSrc"
      class="scenic-img"
      alt=""
      decoding="async"
      loading="eager"
      @error="onError"
    />

    <!-- Fallback: procedurally-generated SVG scenes (used only if the image
         file is missing/failed to load). Kept compact since real art covers
         the actual production case. -->
    <svg v-else-if="scene === 'cityscape'" class="scenic-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fb-cs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a0a3a"/><stop offset="50%" stop-color="#5a1a5a"/><stop offset="100%" stop-color="#c93a7a"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#fb-cs-sky)"/>
      <circle cx="1040" cy="540" r="80" fill="#ffd4b8" opacity="0.7"/>
      <g fill="#0a0218">
        <rect x="100" y="500" width="120" height="400"/><rect x="240" y="450" width="140" height="450"/>
        <rect x="400" y="510" width="130" height="390"/><rect x="550" y="470" width="120" height="430"/>
        <rect x="690" y="500" width="110" height="400"/><rect x="820" y="460" width="140" height="440"/>
        <rect x="980" y="500" width="120" height="400"/><rect x="1120" y="470" width="130" height="430"/>
        <rect x="1270" y="490" width="120" height="410"/><rect x="1410" y="460" width="160" height="440"/>
      </g>
    </svg>
    <svg v-else-if="scene === 'lobby'" class="scenic-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1600" height="900" fill="#1a0a28"/>
      <rect x="0" y="700" width="1600" height="200" fill="#0a0410"/>
      <ellipse cx="800" cy="850" rx="500" ry="50" fill="#5a1a3a" opacity="0.5"/>
      <circle cx="680" cy="250" r="40" fill="#fff4dc" opacity="0.85"/>
    </svg>
    <svg v-else-if="scene === 'arena'" class="scenic-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1600" height="900" fill="#0a0418"/>
      <g transform="translate(800 450)" fill="none" stroke="#ff6b9d" opacity="0.5">
        <circle r="350" stroke-width="2"/><circle r="220" stroke-width="1.2"/>
      </g>
    </svg>
    <svg v-else-if="scene === 'map'" class="scenic-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1600" height="900" fill="#1a0820"/>
      <g fill="none" stroke="#3a1a48" stroke-width="1" opacity="0.4">
        <path d="M 100 200 Q 700 250 1300 200"/><path d="M 100 400 Q 700 450 1300 400"/><path d="M 100 600 Q 700 650 1300 600"/>
      </g>
    </svg>
    <svg v-else-if="scene === 'archive'" class="scenic-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1600" height="900" fill="#1f0a30"/>
      <g v-for="row in 4" :key="row">
        <g :transform="`translate(0 ${(row - 1) * 220 + 60})`">
          <rect v-for="b in 50" :key="b" :x="b * 30 + 10" y="20" width="22" height="140"
                :fill="['#5a1a3a', '#3a1a5a', '#1a3a5a', '#3a5a1a', '#5a3a1a'][b % 5]" opacity="0.7"/>
          <rect x="0" y="170" width="1600" height="14" fill="#3a1820"/>
        </g>
      </g>
    </svg>
    <svg v-else-if="scene === 'shop'" class="scenic-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1600" height="900" fill="#1a0a30"/>
      <rect x="0" y="700" width="1600" height="200" fill="#3a1820"/>
    </svg>
    <svg v-else-if="scene === 'sanctuary'" class="scenic-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <rect width="1600" height="900" fill="#0a0418"/>
      <g v-for="i in 4" :key="i">
        <rect :x="i * 80 + 20" y="100" width="40" height="700" fill="#3a1830"/>
        <rect :x="1280 + i * 80" y="100" width="40" height="700" fill="#3a1830"/>
      </g>
    </svg>

    <!-- Overlay vignette + grain — applied on top of either image or SVG -->
    <div class="scenic-vignette"></div>
    <div class="scenic-grain"></div>
  </div>
</template>

<style scoped>
.scenic-bg {
  position: absolute;
  inset: 0;
  z-index: -10;
  overflow: hidden;
  pointer-events: none;
}
.scenic-img, .scenic-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  user-select: none;
}
.scenic-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.7) 100%);
  pointer-events: none;
}
.scenic-grain {
  position: absolute; inset: 0;
  background-image:
    radial-gradient(1px 1px at 23% 17%, rgba(255,255,255,0.08), transparent 50%),
    radial-gradient(1px 1px at 67% 43%, rgba(255,255,255,0.06), transparent 50%),
    radial-gradient(1px 1px at 41% 79%, rgba(255,255,255,0.07), transparent 50%),
    radial-gradient(1px 1px at 89% 23%, rgba(255,255,255,0.05), transparent 50%);
  background-size: 220px 220px;
  opacity: 0.35;
  animation: grain-shift 6s steps(4) infinite;
  pointer-events: none;
  mix-blend-mode: overlay;
}
@keyframes grain-shift {
  0% { transform: translate(0,0); }
  25% { transform: translate(-10px, 5px); }
  50% { transform: translate(8px, -8px); }
  75% { transform: translate(-5px, -3px); }
  100% { transform: translate(0,0); }
}
</style>
