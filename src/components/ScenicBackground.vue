<script setup lang="ts">
const props = withDefaults(defineProps<{
  scene?: "cityscape" | "lobby" | "arena" | "map" | "archive" | "shop" | "sanctuary";
}>(), {
  scene: "cityscape",
});
</script>

<template>
  <div class="scenic-bg">
    <!-- CITYSCAPE: title screen - apartment skyline at twilight -->
    <svg v-if="scene === 'cityscape'" class="scenic-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sky-twi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a0a3a"/>
          <stop offset="40%" stop-color="#3a1a5a"/>
          <stop offset="70%" stop-color="#7a2a6a"/>
          <stop offset="100%" stop-color="#c93a7a"/>
        </linearGradient>
        <radialGradient id="sun-glow" cx="0.65" cy="0.6" r="0.4">
          <stop offset="0%" stop-color="#ffd4b8" stop-opacity="0.95"/>
          <stop offset="40%" stop-color="#ff9bbf" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#ff9bbf" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="bld-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a0a2a"/>
          <stop offset="100%" stop-color="#080414"/>
        </linearGradient>
        <linearGradient id="bld-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0a0218"/>
          <stop offset="100%" stop-color="#040108"/>
        </linearGradient>
        <pattern id="window-back" x="0" y="0" width="20" height="28" patternUnits="userSpaceOnUse">
          <rect width="10" height="14" x="3" y="6" fill="#ffd680" opacity="0.55"/>
        </pattern>
        <pattern id="window-front" x="0" y="0" width="22" height="32" patternUnits="userSpaceOnUse">
          <rect width="12" height="16" x="4" y="8" fill="#ffe4a0" opacity="0.75"/>
        </pattern>
      </defs>

      <!-- Sky -->
      <rect width="1600" height="900" fill="url(#sky-twi)"/>
      <!-- Sun glow -->
      <rect width="1600" height="900" fill="url(#sun-glow)"/>
      <!-- Sun disc -->
      <circle cx="1040" cy="540" r="80" fill="#ffd4b8" opacity="0.8"/>
      <circle cx="1040" cy="540" r="50" fill="#ffe8d0"/>

      <!-- Stars -->
      <g opacity="0.8">
        <circle cx="120" cy="80" r="1.2" fill="#fff"/>
        <circle cx="280" cy="50" r="0.8" fill="#fff"/>
        <circle cx="430" cy="120" r="1" fill="#fff"/>
        <circle cx="590" cy="60" r="1.4" fill="#fff"/>
        <circle cx="740" cy="100" r="0.9" fill="#fff"/>
        <circle cx="1240" cy="40" r="1.2" fill="#fff"/>
        <circle cx="1380" cy="100" r="1" fill="#fff"/>
        <circle cx="1500" cy="60" r="1.3" fill="#fff"/>
      </g>

      <!-- Far buildings layer -->
      <g opacity="0.7">
        <rect x="40" y="500" width="120" height="400" fill="url(#bld-grad)"/>
        <rect x="40" y="500" width="120" height="400" fill="url(#window-back)"/>
        <rect x="170" y="450" width="100" height="450" fill="url(#bld-grad)"/>
        <rect x="170" y="450" width="100" height="450" fill="url(#window-back)"/>
        <rect x="280" y="530" width="140" height="370" fill="url(#bld-grad)"/>
        <rect x="280" y="530" width="140" height="370" fill="url(#window-back)"/>
        <rect x="430" y="480" width="110" height="420" fill="url(#bld-grad)"/>
        <rect x="430" y="480" width="110" height="420" fill="url(#window-back)"/>
        <rect x="550" y="510" width="130" height="390" fill="url(#bld-grad)"/>
        <rect x="550" y="510" width="130" height="390" fill="url(#window-back)"/>
        <rect x="690" y="460" width="120" height="440" fill="url(#bld-grad)"/>
        <rect x="690" y="460" width="120" height="440" fill="url(#window-back)"/>
        <rect x="820" y="490" width="100" height="410" fill="url(#bld-grad)"/>
        <rect x="820" y="490" width="100" height="410" fill="url(#window-back)"/>
        <rect x="930" y="470" width="130" height="430" fill="url(#bld-grad)"/>
        <rect x="930" y="470" width="130" height="430" fill="url(#window-back)"/>
        <rect x="1070" y="520" width="110" height="380" fill="url(#bld-grad)"/>
        <rect x="1070" y="520" width="110" height="380" fill="url(#window-back)"/>
        <rect x="1190" y="490" width="130" height="410" fill="url(#bld-grad)"/>
        <rect x="1190" y="490" width="130" height="410" fill="url(#window-back)"/>
        <rect x="1330" y="500" width="120" height="400" fill="url(#bld-grad)"/>
        <rect x="1330" y="500" width="120" height="400" fill="url(#window-back)"/>
        <rect x="1460" y="470" width="140" height="430" fill="url(#bld-grad)"/>
        <rect x="1460" y="470" width="140" height="430" fill="url(#window-back)"/>
      </g>

      <!-- Closer buildings -->
      <g>
        <rect x="-20" y="620" width="200" height="280" fill="url(#bld-front)"/>
        <rect x="-20" y="620" width="200" height="280" fill="url(#window-front)"/>
        <rect x="190" y="580" width="160" height="320" fill="url(#bld-front)"/>
        <rect x="190" y="580" width="160" height="320" fill="url(#window-front)"/>
        <polygon points="190,580 270,540 350,580" fill="#1a0820"/>
        <rect x="360" y="600" width="200" height="300" fill="url(#bld-front)"/>
        <rect x="360" y="600" width="200" height="300" fill="url(#window-front)"/>
        <rect x="570" y="560" width="180" height="340" fill="url(#bld-front)"/>
        <rect x="570" y="560" width="180" height="340" fill="url(#window-front)"/>
        <rect x="760" y="610" width="170" height="290" fill="url(#bld-front)"/>
        <rect x="760" y="610" width="170" height="290" fill="url(#window-front)"/>
        <rect x="940" y="580" width="180" height="320" fill="url(#bld-front)"/>
        <rect x="940" y="580" width="180" height="320" fill="url(#window-front)"/>
        <polygon points="940,580 1030,535 1120,580" fill="#1a0820"/>
        <rect x="1130" y="615" width="170" height="285" fill="url(#bld-front)"/>
        <rect x="1130" y="615" width="170" height="285" fill="url(#window-front)"/>
        <rect x="1310" y="595" width="150" height="305" fill="url(#bld-front)"/>
        <rect x="1310" y="595" width="150" height="305" fill="url(#window-front)"/>
        <rect x="1470" y="560" width="170" height="340" fill="url(#bld-front)"/>
        <rect x="1470" y="560" width="170" height="340" fill="url(#window-front)"/>
      </g>

      <!-- Falling petals -->
      <g class="petals" fill="#ff9bbf" opacity="0.7">
        <ellipse cx="200" cy="200" rx="3" ry="6" transform="rotate(20 200 200)"/>
        <ellipse cx="380" cy="350" rx="2.5" ry="5" transform="rotate(-30 380 350)"/>
        <ellipse cx="620" cy="270" rx="3" ry="6" transform="rotate(45 620 270)"/>
        <ellipse cx="850" cy="180" rx="2" ry="4" transform="rotate(-15 850 180)"/>
        <ellipse cx="1100" cy="320" rx="3" ry="6" transform="rotate(60 1100 320)"/>
        <ellipse cx="1320" cy="220" rx="2.5" ry="5" transform="rotate(-45 1320 220)"/>
        <ellipse cx="500" cy="450" rx="2" ry="4" transform="rotate(10 500 450)"/>
        <ellipse cx="900" cy="400" rx="3" ry="6" transform="rotate(75 900 400)"/>
      </g>

      <!-- Ground gradient overlay -->
      <rect x="0" y="700" width="1600" height="200" fill="url(#bld-front)" opacity="0.5"/>
    </svg>

    <!-- LOBBY: home screen - cozy reception with desk + window -->
    <svg v-else-if="scene === 'lobby'" class="scenic-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lobby-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2a1438"/>
          <stop offset="100%" stop-color="#1a0a28"/>
        </linearGradient>
        <linearGradient id="lobby-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a0822"/>
          <stop offset="100%" stop-color="#0a0410"/>
        </linearGradient>
        <radialGradient id="lobby-lamp" cx="0.5" cy="0.5" r="0.8">
          <stop offset="0%" stop-color="#ffd4b8" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#ffd4b8" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="window-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a0a3a"/>
          <stop offset="100%" stop-color="#5a1a4a"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#lobby-wall)"/>
      <!-- floor -->
      <rect x="0" y="700" width="1600" height="200" fill="url(#lobby-floor)"/>
      <line x1="0" y1="700" x2="1600" y2="700" stroke="#3a1a48" stroke-width="2"/>
      <!-- floor grid -->
      <g stroke="#3a1a48" stroke-width="0.5" opacity="0.5">
        <line x1="0" y1="730" x2="1600" y2="730"/>
        <line x1="0" y1="770" x2="1600" y2="770"/>
        <line x1="0" y1="820" x2="1600" y2="820"/>
      </g>
      <!-- Big arched window -->
      <g transform="translate(800 0)">
        <path d="M -300 200 Q -300 100 0 100 Q 300 100 300 200 L 300 600 L -300 600 Z" fill="url(#window-night)"/>
        <path d="M -300 200 Q -300 100 0 100 Q 300 100 300 200 L 300 600 L -300 600 Z" fill="none" stroke="#5a3858" stroke-width="6"/>
        <line x1="0" y1="100" x2="0" y2="600" stroke="#5a3858" stroke-width="3"/>
        <line x1="-300" y1="350" x2="300" y2="350" stroke="#5a3858" stroke-width="3"/>
        <!-- City silhouette through window -->
        <g opacity="0.7">
          <rect x="-260" y="450" width="50" height="150" fill="#0a0218"/>
          <rect x="-200" y="420" width="40" height="180" fill="#0a0218"/>
          <rect x="-150" y="470" width="60" height="130" fill="#0a0218"/>
          <rect x="-80" y="440" width="50" height="160" fill="#0a0218"/>
          <rect x="-20" y="460" width="40" height="140" fill="#0a0218"/>
          <rect x="30" y="430" width="50" height="170" fill="#0a0218"/>
          <rect x="90" y="450" width="45" height="150" fill="#0a0218"/>
          <rect x="145" y="470" width="55" height="130" fill="#0a0218"/>
          <rect x="210" y="440" width="50" height="160" fill="#0a0218"/>
        </g>
        <!-- Moon -->
        <circle cx="-120" cy="250" r="40" fill="#fff4dc" opacity="0.85"/>
        <circle cx="-110" cy="240" r="32" fill="#1a0a3a" opacity="0.4"/>
        <!-- Stars -->
        <circle cx="-220" cy="180" r="1.2" fill="#fff"/>
        <circle cx="180" cy="200" r="1" fill="#fff"/>
        <circle cx="60" cy="160" r="1.4" fill="#fff"/>
        <circle cx="-50" cy="320" r="0.8" fill="#fff"/>
      </g>
      <!-- Wall sconces -->
      <g transform="translate(200 200)">
        <ellipse cx="0" cy="0" rx="30" ry="40" fill="url(#lobby-lamp)"/>
        <rect x="-12" y="-20" width="24" height="40" fill="#3a1a48"/>
        <path d="M -10 20 L 10 20 L 5 60 L -5 60 Z" fill="#ffd4b8" opacity="0.8"/>
      </g>
      <g transform="translate(1400 200)">
        <ellipse cx="0" cy="0" rx="30" ry="40" fill="url(#lobby-lamp)"/>
        <rect x="-12" y="-20" width="24" height="40" fill="#3a1a48"/>
        <path d="M -10 20 L 10 20 L 5 60 L -5 60 Z" fill="#ffd4b8" opacity="0.8"/>
      </g>
      <!-- Potted plants -->
      <g transform="translate(120 680)">
        <rect x="-30" y="0" width="60" height="50" fill="#3a1820"/>
        <path d="M 0 -10 Q -30 -50 -20 -80 Q -10 -40 0 -50 Q 10 -40 20 -80 Q 30 -50 0 -10 Z" fill="#2a4a2a"/>
      </g>
      <g transform="translate(1480 680)">
        <rect x="-30" y="0" width="60" height="50" fill="#3a1820"/>
        <path d="M 0 -10 Q -30 -50 -20 -80 Q -10 -40 0 -50 Q 10 -40 20 -80 Q 30 -50 0 -10 Z" fill="#2a4a2a"/>
      </g>
      <!-- Carpet -->
      <ellipse cx="800" cy="800" rx="500" ry="50" fill="#5a1a3a" opacity="0.5"/>
    </svg>

    <!-- ARENA: battle background - circular magic circle on tiled floor -->
    <svg v-else-if="scene === 'arena'" class="scenic-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="arena-bg" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0%" stop-color="#3a1a5a" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#0a0418" stop-opacity="1"/>
        </radialGradient>
        <pattern id="arena-tile" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill="#1a0a2a"/>
          <rect x="0" y="0" width="80" height="80" fill="none" stroke="#3a1a4a" stroke-width="0.5"/>
          <circle cx="40" cy="40" r="1.5" fill="#5a2a6a"/>
        </pattern>
        <filter id="glow-arena">
          <feGaussianBlur stdDeviation="2"/>
        </filter>
      </defs>
      <rect width="1600" height="900" fill="url(#arena-bg)"/>
      <rect width="1600" height="900" fill="url(#arena-tile)" opacity="0.4"/>

      <!-- Outer circle -->
      <g transform="translate(800 450)" opacity="0.5" fill="none" stroke="#ff6b9d">
        <circle r="380" stroke-width="1"/>
        <circle r="350" stroke-width="2"/>
        <circle r="280" stroke-width="0.8"/>
        <circle r="220" stroke-width="1.2"/>
        <!-- Inner runes -->
        <g stroke="#c34dff">
          <polygon points="0,-200 173,100 -173,100" stroke-width="1.5"/>
          <polygon points="0,200 173,-100 -173,-100" stroke-width="1.5"/>
        </g>
        <!-- Cardinal marks -->
        <line x1="-380" y1="0" x2="-360" y2="0" stroke-width="3"/>
        <line x1="380" y1="0" x2="360" y2="0" stroke-width="3"/>
        <line x1="0" y1="-380" x2="0" y2="-360" stroke-width="3"/>
        <line x1="0" y1="380" x2="0" y2="360" stroke-width="3"/>
      </g>

      <!-- Pillars -->
      <g opacity="0.45">
        <rect x="100" y="200" width="40" height="600" fill="#2a1438"/>
        <rect x="100" y="170" width="40" height="20" fill="#3a1c48"/>
        <rect x="100" y="800" width="40" height="20" fill="#3a1c48"/>
        <rect x="1460" y="200" width="40" height="600" fill="#2a1438"/>
        <rect x="1460" y="170" width="40" height="20" fill="#3a1c48"/>
        <rect x="1460" y="800" width="40" height="20" fill="#3a1c48"/>
      </g>

      <!-- Floor reflection -->
      <ellipse cx="800" cy="850" rx="600" ry="30" fill="#ff6b9d" opacity="0.1"/>
    </svg>

    <!-- MAP: stage select - parchment map -->
    <svg v-else-if="scene === 'map'" class="scenic-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="map-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a0820"/>
          <stop offset="100%" stop-color="#080214"/>
        </linearGradient>
        <pattern id="map-paper" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
          <rect width="200" height="200" fill="transparent"/>
          <circle cx="50" cy="40" r="1" fill="#3a1a48" opacity="0.3"/>
          <circle cx="150" cy="120" r="0.8" fill="#3a1a48" opacity="0.3"/>
          <circle cx="80" cy="170" r="1.2" fill="#3a1a48" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="1600" height="900" fill="url(#map-bg)"/>
      <rect width="1600" height="900" fill="url(#map-paper)"/>

      <!-- Topographic contour lines -->
      <g fill="none" stroke="#3a1a48" stroke-width="1" opacity="0.4">
        <path d="M 100 200 Q 400 150 700 250 T 1300 200 T 1600 220"/>
        <path d="M 100 320 Q 400 280 700 380 T 1300 330 T 1600 350"/>
        <path d="M 100 440 Q 400 410 700 510 T 1300 460 T 1600 480"/>
        <path d="M 100 560 Q 400 540 700 640 T 1300 590 T 1600 610"/>
        <path d="M 100 680 Q 400 670 700 770 T 1300 720 T 1600 740"/>
      </g>

      <!-- Path/road -->
      <g stroke="#ff6b9d" stroke-width="3" fill="none" opacity="0.6" stroke-dasharray="6 6">
        <path d="M 100 750 Q 300 700 500 600 T 900 500 T 1300 350 T 1500 200"/>
      </g>

      <!-- Compass rose -->
      <g transform="translate(120 130)" opacity="0.5">
        <circle r="40" fill="none" stroke="#ff6b9d" stroke-width="1.5"/>
        <polygon points="0,-35 5,0 0,35 -5,0" fill="#ff6b9d"/>
        <polygon points="-35,0 0,5 35,0 0,-5" fill="#ff6b9d" opacity="0.6"/>
        <text x="0" y="-50" text-anchor="middle" font-family="Orbitron" font-size="12" fill="#ff6b9d" font-weight="900">N</text>
      </g>

      <!-- Decorative apartment icons -->
      <g opacity="0.3" fill="#7a3a8a">
        <g transform="translate(300 600)"><rect x="-15" y="-20" width="30" height="30"/><polygon points="-18,-20 0,-35 18,-20"/></g>
        <g transform="translate(800 400)"><rect x="-15" y="-20" width="30" height="30"/><polygon points="-18,-20 0,-35 18,-20"/></g>
        <g transform="translate(1200 250)"><rect x="-15" y="-20" width="30" height="30"/><polygon points="-18,-20 0,-35 18,-20"/></g>
      </g>
    </svg>

    <!-- ARCHIVE: dex screen - library wall -->
    <svg v-else-if="scene === 'archive'" class="scenic-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="archive-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1f0a30"/>
          <stop offset="100%" stop-color="#0a0218"/>
        </linearGradient>
        <linearGradient id="shelf-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3a1820"/>
          <stop offset="100%" stop-color="#1a0810"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#archive-wall)"/>

      <!-- Bookshelves -->
      <g v-for="row in 4" :key="row">
        <g :transform="`translate(0 ${(row - 1) * 220 + 60})`">
          <rect x="0" y="0" width="1600" height="180" fill="#0a0218"/>
          <!-- Books -->
          <g v-for="b in 50" :key="b">
            <rect
              :x="b * 30 + 10"
              y="20"
              width="22"
              height="140"
              :fill="['#5a1a3a', '#3a1a5a', '#1a3a5a', '#3a5a1a', '#5a3a1a'][b % 5]"
              opacity="0.7"
            />
          </g>
          <!-- Shelf -->
          <rect x="0" y="170" width="1600" height="14" fill="url(#shelf-wood)"/>
        </g>
      </g>

      <!-- Floating particles -->
      <g opacity="0.5">
        <circle cx="200" cy="120" r="1.5" fill="#ffd4b8"/>
        <circle cx="500" cy="280" r="1.2" fill="#ffd4b8"/>
        <circle cx="900" cy="180" r="1.5" fill="#ffd4b8"/>
        <circle cx="1300" cy="320" r="1.2" fill="#ffd4b8"/>
        <circle cx="350" cy="560" r="1.5" fill="#ffd4b8"/>
        <circle cx="1100" cy="620" r="1.2" fill="#ffd4b8"/>
      </g>
    </svg>

    <!-- SHOP: shop screen - merchant counter -->
    <svg v-else-if="scene === 'shop'" class="scenic-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shop-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1a0a30"/>
          <stop offset="100%" stop-color="#0a0414"/>
        </linearGradient>
        <radialGradient id="shop-glow" cx="0.5" cy="0.7" r="0.8">
          <stop offset="0%" stop-color="#ffce4d" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#ffce4d" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#shop-bg)"/>
      <rect width="1600" height="900" fill="url(#shop-glow)"/>

      <!-- Banner -->
      <g transform="translate(800 100)">
        <path d="M -300 0 L 300 0 L 280 50 L -280 50 Z" fill="#5a1a3a" opacity="0.6"/>
        <path d="M -300 0 L -310 30 L -310 60 L -280 50 Z" fill="#3a0a20"/>
        <path d="M 300 0 L 310 30 L 310 60 L 280 50 Z" fill="#3a0a20"/>
      </g>

      <!-- Counter -->
      <rect x="0" y="700" width="1600" height="200" fill="#3a1820"/>
      <rect x="0" y="690" width="1600" height="20" fill="#5a2a30"/>
      <!-- Counter highlight -->
      <line x1="0" y1="690" x2="1600" y2="690" stroke="#7a3a40" stroke-width="3"/>

      <!-- Stack of items -->
      <g transform="translate(200 600)">
        <rect x="-30" y="40" width="60" height="50" fill="#5a3a1a"/>
        <rect x="-30" y="0" width="60" height="40" fill="#7a4a2a"/>
        <text x="0" y="25" text-anchor="middle" font-family="Orbitron" font-size="20" fill="#ffce4d" font-weight="900">★</text>
      </g>

      <!-- Hanging signs -->
      <g transform="translate(400 200)" opacity="0.5">
        <line x1="0" y1="0" x2="0" y2="-100" stroke="#3a1820" stroke-width="2"/>
        <rect x="-40" y="0" width="80" height="50" fill="#7a3a40" stroke="#3a1820" stroke-width="2"/>
        <text x="0" y="33" text-anchor="middle" font-family="Orbitron" font-size="20" fill="#ffd4b8">G</text>
      </g>
      <g transform="translate(1200 200)" opacity="0.5">
        <line x1="0" y1="0" x2="0" y2="-100" stroke="#3a1820" stroke-width="2"/>
        <rect x="-40" y="0" width="80" height="50" fill="#7a3a40" stroke="#3a1820" stroke-width="2"/>
        <text x="0" y="33" text-anchor="middle" font-family="Orbitron" font-size="20" fill="#ffd4b8">$</text>
      </g>
    </svg>

    <!-- SANCTUARY: party/character detail - shrine/altar -->
    <svg v-else-if="scene === 'sanctuary'" class="scenic-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sanc-bg" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0%" stop-color="#3a1a5a" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#0a0418"/>
        </radialGradient>
        <linearGradient id="pillar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3a1830"/>
          <stop offset="100%" stop-color="#1a0816"/>
        </linearGradient>
        <radialGradient id="altar-glow" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stop-color="#ffe4f0" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#ffe4f0" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#sanc-bg)"/>
      <rect width="1600" height="900" fill="url(#altar-glow)"/>

      <!-- Pillars left -->
      <g v-for="i in 4" :key="i">
        <g :transform="`translate(${i * 80 + 40} 0)`">
          <rect x="-20" y="100" width="40" height="700" fill="url(#pillar)"/>
          <rect x="-25" y="90" width="50" height="20" fill="#5a2a48"/>
          <rect x="-25" y="800" width="50" height="20" fill="#5a2a48"/>
          <circle cx="0" cy="80" r="6" fill="#ff6b9d" opacity="0.6"/>
        </g>
      </g>
      <!-- Pillars right -->
      <g v-for="i in 4" :key="'r' + i">
        <g :transform="`translate(${1280 + i * 80} 0)`">
          <rect x="-20" y="100" width="40" height="700" fill="url(#pillar)"/>
          <rect x="-25" y="90" width="50" height="20" fill="#5a2a48"/>
          <rect x="-25" y="800" width="50" height="20" fill="#5a2a48"/>
          <circle cx="0" cy="80" r="6" fill="#ff6b9d" opacity="0.6"/>
        </g>
      </g>

      <!-- Central altar -->
      <g transform="translate(800 800)" opacity="0.7">
        <path d="M -200 0 L -160 -80 L 160 -80 L 200 0 Z" fill="#3a1830"/>
        <rect x="-150" y="-90" width="300" height="10" fill="#5a2a48"/>
      </g>

      <!-- Hanging banners -->
      <g v-for="i in 5" :key="'b' + i">
        <g :transform="`translate(${i * 280 + 100} 100)`" opacity="0.4">
          <line x1="0" y1="0" x2="0" y2="50" stroke="#5a2a48" stroke-width="2"/>
          <path d="M -30 50 L 30 50 L 20 200 L -20 200 Z" fill="#5a1a3a"/>
          <circle cx="0" cy="100" r="15" fill="none" stroke="#ff6b9d" stroke-width="2"/>
          <circle cx="0" cy="100" r="6" fill="#ff6b9d"/>
        </g>
      </g>

      <!-- Floor reflection circle -->
      <ellipse cx="800" cy="820" rx="400" ry="20" fill="#ff6b9d" opacity="0.15"/>
    </svg>

    <!-- Vignette + grain overlay -->
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
.scenic-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.scenic-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 80%, rgba(0,0,0,0.7) 100%);
  pointer-events: none;
}
.scenic-grain {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 23% 17%, rgba(255,255,255,0.08), transparent 50%),
    radial-gradient(1px 1px at 67% 43%, rgba(255,255,255,0.06), transparent 50%),
    radial-gradient(1px 1px at 41% 79%, rgba(255,255,255,0.07), transparent 50%),
    radial-gradient(1px 1px at 89% 23%, rgba(255,255,255,0.05), transparent 50%);
  background-size: 220px 220px;
  opacity: 0.5;
  animation: grain-shift 6s steps(4) infinite;
  pointer-events: none;
}
@keyframes grain-shift {
  0% { transform: translate(0,0); }
  25% { transform: translate(-10px, 5px); }
  50% { transform: translate(8px, -8px); }
  75% { transform: translate(-5px, -3px); }
  100% { transform: translate(0,0); }
}

.petals ellipse {
  animation: petal-fall 12s linear infinite;
}
@keyframes petal-fall {
  0% { transform: translateY(-100px) rotate(0deg); opacity: 0; }
  20% { opacity: 0.7; }
  100% { transform: translateY(900px) rotate(360deg); opacity: 0; }
}
</style>
