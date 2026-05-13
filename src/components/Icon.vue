<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string;
  size?: number | string;
}>(), {
  size: 20,
});
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    class="icon-svg"
    aria-hidden="true"
  >
    <!-- Elements -->
    <g v-if="name === 'fire'">
      <path d="M12 2c0 4-4 5-4 9a4 4 0 0 0 8 0c0-1.5-1-2.5-1-4 1 1 3 2 3 5a6 6 0 1 1-12 0c0-5 6-6 6-10z" fill="url(#fire-grad)" stroke="currentColor" stroke-width="0.5"/>
      <defs><linearGradient id="fire-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#fb923c"/><stop offset="100%" stop-color="#dc2626"/></linearGradient></defs>
    </g>
    <g v-else-if="name === 'water'">
      <path d="M12 2C8 7 5 11 5 15a7 7 0 0 0 14 0c0-4-3-8-7-13z" fill="url(#water-grad)" stroke="currentColor" stroke-width="0.5"/>
      <ellipse cx="10" cy="13" rx="1.5" ry="2.5" fill="#fff" opacity="0.6"/>
      <defs><linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bae6fd"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient></defs>
    </g>
    <g v-else-if="name === 'wood'">
      <path d="M12 2c-3 4-7 5-7 9 0 5 4 8 7 11 3-3 7-6 7-11 0-4-4-5-7-9z" fill="url(#wood-grad)" stroke="currentColor" stroke-width="0.5"/>
      <path d="M12 6v14M9 11l3 2 3-2" stroke="#0d8a3f" stroke-width="0.8" opacity="0.5"/>
      <defs><linearGradient id="wood-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bbf7d0"/><stop offset="100%" stop-color="#15803d"/></linearGradient></defs>
    </g>
    <g v-else-if="name === 'light'">
      <path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z" fill="url(#light-grad)" stroke="currentColor" stroke-width="0.5"/>
      <defs><radialGradient id="light-grad"><stop offset="0%" stop-color="#fef9c3"/><stop offset="100%" stop-color="#eab308"/></radialGradient></defs>
    </g>
    <g v-else-if="name === 'dark'">
      <path d="M12 2a10 10 0 1 0 10 10A8 8 0 0 1 12 2z" fill="url(#dark-grad)" stroke="currentColor" stroke-width="0.5"/>
      <circle cx="16" cy="8" r="1" fill="#e9d5ff" opacity="0.7"/>
      <circle cx="18" cy="13" r="0.5" fill="#e9d5ff" opacity="0.5"/>
      <defs><linearGradient id="dark-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4c1d95"/><stop offset="100%" stop-color="#1e1b4b"/></linearGradient></defs>
    </g>

    <!-- Skill kinds -->
    <g v-else-if="name === 'sword'">
      <path d="M14.5 17.5L4 7V4h3l10.5 10.5M13 19l6-6M17 17l3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g v-else-if="name === 'shield'">
      <path d="M12 2L4 5v6c0 5 3 9 8 11 5-2 8-6 8-11V5l-8-3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="currentColor" fill-opacity="0.15"/>
    </g>
    <g v-else-if="name === 'heart'">
      <path d="M12 21s-7-4.5-9-9.5C1.5 7 4 4 7 4c2 0 3.5 1.5 5 3 1.5-1.5 3-3 5-3 3 0 5.5 3 4 7.5-2 5-9 9.5-9 9.5z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.2" stroke-linejoin="round"/>
    </g>
    <g v-else-if="name === 'star'">
      <path d="M12 2l3 7 7 1-5 5 1.5 7L12 18.5 5.5 22 7 15l-5-5 7-1 3-7z" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.6" stroke-linejoin="round"/>
    </g>
    <g v-else-if="name === 'magic'">
      <path d="M5 19l14-14M5 5l1.5 4.5L11 11l-4.5 1.5L5 17l-1.5-4.5L-1 11l4.5-1.5L5 5z" transform="translate(2 1)" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.3" stroke-linejoin="round"/>
    </g>
    <g v-else-if="name === 'arrow-up'">
      <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g v-else-if="name === 'arrow-down'">
      <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>

    <!-- UI -->
    <g v-else-if="name === 'gold'">
      <circle cx="12" cy="12" r="9" fill="url(#gold-g)" stroke="#92400e" stroke-width="1"/>
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#fbbf24" stroke-width="1"/>
      <text x="12" y="16" text-anchor="middle" font-size="9" font-weight="900" fill="#7c2d12" font-family="Orbitron, monospace">G</text>
      <defs><radialGradient id="gold-g"><stop offset="0%" stop-color="#fef3c7"/><stop offset="60%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#d97706"/></radialGradient></defs>
    </g>
    <g v-else-if="name === 'gem'">
      <path d="M6 9l6-7 6 7-6 13z" fill="url(#gem-g)" stroke="#312e81" stroke-width="1" stroke-linejoin="round"/>
      <path d="M6 9h12M12 2v20" stroke="#fff" stroke-width="0.6" opacity="0.5"/>
      <defs><linearGradient id="gem-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a5f3fc"/><stop offset="100%" stop-color="#0891b2"/></linearGradient></defs>
    </g>
    <g v-else-if="name === 'flask'">
      <path d="M9 2v6L4 19c-1 2 0 3 2 3h12c2 0 3-1 2-3l-5-11V2" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.2" stroke-linejoin="round"/>
      <path d="M9 2h6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M5 16h14" stroke="currentColor" stroke-width="1.2" opacity="0.7"/>
    </g>
    <g v-else-if="name === 'scroll'">
      <path d="M4 4h14a2 2 0 0 1 2 2v3h-2a2 2 0 0 0-2 2v9H6a2 2 0 0 1-2-2V4z" stroke="currentColor" stroke-width="1.8" fill="currentColor" fill-opacity="0.15" stroke-linejoin="round"/>
      <path d="M7 9h8M7 13h8M7 17h5" stroke="currentColor" stroke-width="1.2"/>
    </g>
    <g v-else-if="name === 'key'">
      <circle cx="8" cy="14" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
      <path d="M11 12l11-11M19 4l3 3M16 7l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </g>
    <g v-else-if="name === 'crown'">
      <path d="M3 18L5 7l4 4 3-7 3 7 4-4 2 11z" stroke="currentColor" stroke-width="1.8" fill="currentColor" fill-opacity="0.4" stroke-linejoin="round"/>
      <path d="M3 21h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="5" cy="7" r="1" fill="currentColor"/>
      <circle cx="12" cy="4" r="1" fill="currentColor"/>
      <circle cx="19" cy="7" r="1" fill="currentColor"/>
    </g>
    <g v-else-if="name === 'home'">
      <path d="M3 11l9-8 9 8M5 10v10h14V10" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>
      <path d="M10 20v-6h4v6" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="none"/>
    </g>
    <g v-else-if="name === 'map'">
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" fill="currentColor" fill-opacity="0.1"/>
      <path d="M9 4v16M15 6v16" stroke="currentColor" stroke-width="1.5" opacity="0.7"/>
    </g>
    <g v-else-if="name === 'users'">
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8" fill="none"/>
      <path d="M3 21c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <circle cx="17" cy="10" r="2.5" stroke="currentColor" stroke-width="1.6" fill="none"/>
      <path d="M15 21c0-2.5 1.5-4 3.5-4s3.5 1.5 3.5 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    </g>
    <g v-else-if="name === 'book'">
      <path d="M4 3h7c1.5 0 3 0.5 3 3v15c-1-1.5-2-2-3-2H4V3z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.15" stroke-linejoin="round"/>
      <path d="M20 3h-7c-1.5 0-3 0.5-3 3v15c1-1.5 2-2 3-2h7V3z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.15" stroke-linejoin="round"/>
    </g>
    <g v-else-if="name === 'bag'">
      <path d="M6 8h12l1 13H5L6 8z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.15" stroke-linejoin="round"/>
      <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="2" fill="none"/>
    </g>
    <g v-else-if="name === 'arrow-back'">
      <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g v-else-if="name === 'arrow-right'">
      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g v-else-if="name === 'check'">
      <path d="M4 12l5 5L20 6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g v-else-if="name === 'lock'">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.15"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" stroke-width="2" fill="none"/>
    </g>
    <g v-else-if="name === 'sparkle'">
      <path d="M12 2c0 4 2 6 6 6-4 0-6 2-6 6 0-4-2-6-6-6 4 0 6-2 6-6z" fill="url(#spark-g)" stroke="currentColor" stroke-width="0.6"/>
      <path d="M19 14c0 2.5 1 3.5 3.5 3.5-2.5 0-3.5 1-3.5 3.5 0-2.5-1-3.5-3.5-3.5 2.5 0 3.5-1 3.5-3.5z" fill="url(#spark-g)" opacity="0.7"/>
      <defs><radialGradient id="spark-g"><stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#fbbf24"/></radialGradient></defs>
    </g>
    <g v-else-if="name === 'capture'">
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.2" fill="none"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
      <path d="M3 12h6M15 12h6M12 3v6M12 15v6" stroke="currentColor" stroke-width="2"/>
    </g>
    <g v-else-if="name === 'flee'">
      <path d="M3 12l6-9 1 6h7l-2 6h2l-6 9-1-6H3l2-6z" stroke="currentColor" stroke-width="2" fill="currentColor" fill-opacity="0.2" stroke-linejoin="round"/>
    </g>
    <g v-else-if="name === 'google'">
      <path fill="#FFC107" d="M21.8 10.25H21V10.2H12v3.6h5.1c-0.7 2.1-2.7 3.6-5.1 3.6-3 0-5.4-2.4-5.4-5.4s2.4-5.4 5.4-5.4c1.4 0 2.7 0.5 3.6 1.4l2.6-2.6C16.5 3.4 14.4 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6 9.6-4.3 9.6-9.6c0-0.6-0.05-1.1-0.2-1.75z"/>
      <path fill="#FF3D00" d="M3.45 7.85l3 2.2C7.25 8 9.45 6.6 12 6.6c1.4 0 2.7 0.5 3.6 1.4l2.6-2.6C16.5 3.4 14.4 2.4 12 2.4 8.3 2.4 5.05 4.5 3.45 7.85z"/>
      <path fill="#4CAF50" d="M12 21.6c2.4 0 4.5-0.9 6.1-2.4l-2.8-2.4c-0.9 0.6-2 1-3.3 1-2.5 0-4.5-1.6-5.2-3.8l-3 2.4c1.6 3.1 4.9 5.2 8.2 5.2z"/>
      <path fill="#1976D2" d="M21.8 10.25H21V10.2H12v3.6h5.1c-0.4 1.1-1.1 2-2 2.7l2.8 2.4c-0.2 0.2 3.1-2.2 3.1-7.2 0-0.6-0.05-1.1-0.2-1.45z"/>
    </g>
    <g v-else-if="name === 'guest'">
      <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8" fill="currentColor" fill-opacity="0.2"/>
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.8" fill="currentColor" fill-opacity="0.15" stroke-linecap="round"/>
    </g>
    <g v-else-if="name === 'cloud'">
      <path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.5-1.5A4 4 0 0 1 18 18H7z" stroke="currentColor" stroke-width="1.8" fill="currentColor" fill-opacity="0.15" stroke-linejoin="round"/>
    </g>
    <g v-else-if="name === 'save'">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.8" fill="currentColor" fill-opacity="0.1"/>
      <path d="M7 4v6h10V4M9 14h6v6H9z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/>
    </g>
    <g v-else-if="name === 'sleep'">
      <path d="M11 4a9 9 0 1 0 9 9c-5 0-9-4-9-9z" stroke="currentColor" stroke-width="1.8" fill="currentColor" fill-opacity="0.15" stroke-linejoin="round"/>
      <circle cx="16" cy="6" r="0.6" fill="currentColor"/>
      <circle cx="20" cy="9" r="0.6" fill="currentColor"/>
    </g>
    <g v-else-if="name === 'play'">
      <path d="M7 4l13 8-13 8V4z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    </g>
    <g v-else-if="name === 'flame-small'">
      <path d="M12 4c0 3-3 4-3 7a3 3 0 0 0 6 0c0-1-1-2-1-3 1 1 2 1 2 3a4 4 0 1 1-8 0c0-3 4-4 4-7z" fill="currentColor"/>
    </g>

    <!-- Default -->
    <circle v-else cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>
</template>

<style scoped>
.icon-svg {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
