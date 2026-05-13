<script setup lang="ts">
const props = defineProps<{
  kind: "projectile" | "impact" | "arc";
  element: "fire" | "water" | "wood" | "light" | "dark";
  fromX: number;     // px in container space
  fromY: number;
  toX: number;
  toY: number;
  duration?: number; // ms
}>();

const ELEM_COLOR: Record<string, string> = {
  fire: "#ff6b47",
  water: "#3aa8ff",
  wood: "#42d977",
  light: "#fde047",
  dark: "#c084fc",
};
const color = ELEM_COLOR[props.element] ?? "#fff";
const dur = props.duration ?? 450;

const angleDeg = (Math.atan2(props.toY - props.fromY, props.toX - props.fromX) * 180) / Math.PI;
const dist = Math.hypot(props.toX - props.fromX, props.toY - props.fromY);
</script>

<template>
  <!-- Projectile: a streak that travels from->to -->
  <div
    v-if="kind === 'projectile'"
    class="fx fx-projectile"
    :style="{
      left: fromX + 'px',
      top: fromY + 'px',
      width: dist + 'px',
      transform: `rotate(${angleDeg}deg)`,
      animationDuration: dur + 'ms',
      '--c': color,
    } as any"
  >
    <div class="fx-streak"></div>
    <div class="fx-head"></div>
  </div>

  <!-- Impact: radial burst at target location -->
  <div
    v-if="kind === 'impact'"
    class="fx fx-impact"
    :style="{
      left: toX + 'px',
      top: toY + 'px',
      animationDuration: dur + 'ms',
      '--c': color,
    } as any"
  >
    <div class="fx-impact-ring"></div>
    <div class="fx-impact-flash"></div>
    <span v-for="i in 8" :key="i" class="fx-impact-spark" :style="{ '--i': i, '--c': color } as any"></span>
  </div>
</template>

<style scoped>
.fx {
  position: absolute;
  pointer-events: none;
  z-index: 60;
}

/* Projectile streak */
.fx-projectile {
  height: 8px;
  transform-origin: 0 50%;
  animation: fx-streak-anim var(--d, 450ms) cubic-bezier(.2,.6,.4,1) forwards;
}
.fx-streak {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent 0%, var(--c) 60%, white 90%, white 100%);
  border-radius: 4px;
  filter: drop-shadow(0 0 8px var(--c)) drop-shadow(0 0 16px var(--c));
  transform-origin: 100% 50%;
  animation: fx-streak-len var(--d, 450ms) cubic-bezier(.2,.6,.4,1) forwards;
}
.fx-head {
  position: absolute;
  right: 0; top: 50%;
  width: 18px; height: 18px;
  transform: translate(50%, -50%);
  background: radial-gradient(circle, white 10%, var(--c) 50%, transparent 80%);
  border-radius: 50%;
  filter: drop-shadow(0 0 12px var(--c)) drop-shadow(0 0 24px white);
  animation: fx-head-pulse var(--d, 450ms) ease-out forwards;
}
@keyframes fx-streak-anim {
  0% { transform: rotate(var(--r, 0deg)) scaleX(0); opacity: 0; }
  10% { opacity: 1; transform: rotate(var(--r, 0deg)) scaleX(0.15); }
  50% { opacity: 1; transform: rotate(var(--r, 0deg)) scaleX(0.8); }
  100% { opacity: 0; transform: rotate(var(--r, 0deg)) scaleX(1); }
}
@keyframes fx-streak-len {
  0% { transform: scaleX(0); opacity: 0; }
  20% { opacity: 1; }
  80% { transform: scaleX(1); opacity: 1; }
  100% { transform: scaleX(1); opacity: 0; }
}
@keyframes fx-head-pulse {
  0% { transform: translate(50%, -50%) scale(0); opacity: 0; }
  20% { opacity: 1; transform: translate(50%, -50%) scale(1.2); }
  100% { transform: translate(50%, -50%) scale(0.6); opacity: 0; }
}

/* Impact burst */
.fx-impact {
  width: 0; height: 0;
}
.fx-impact-ring {
  position: absolute;
  left: 0; top: 0;
  width: 30px; height: 30px;
  margin-left: -15px; margin-top: -15px;
  border: 3px solid var(--c);
  border-radius: 50%;
  filter: drop-shadow(0 0 10px var(--c));
  animation: fx-ring-anim var(--d, 600ms) cubic-bezier(.2,.6,.4,1) forwards;
}
.fx-impact-flash {
  position: absolute;
  left: 0; top: 0;
  width: 60px; height: 60px;
  margin-left: -30px; margin-top: -30px;
  background: radial-gradient(circle, white 0%, var(--c) 35%, transparent 70%);
  border-radius: 50%;
  filter: blur(2px);
  mix-blend-mode: screen;
  animation: fx-flash-anim var(--d, 600ms) ease-out forwards;
}
.fx-impact-spark {
  position: absolute;
  left: 0; top: 0;
  width: 4px; height: 18px;
  background: linear-gradient(to bottom, transparent, var(--c), white);
  border-radius: 2px;
  margin-left: -2px; margin-top: -9px;
  transform-origin: 50% 100%;
  --angle: calc((var(--i) - 1) * 45deg);
  transform: rotate(var(--angle)) translateY(-15px);
  animation: fx-spark-anim var(--d, 600ms) ease-out forwards;
  filter: drop-shadow(0 0 4px var(--c));
}
@keyframes fx-ring-anim {
  0% { transform: scale(0); opacity: 1; }
  60% { opacity: 0.85; }
  100% { transform: scale(3.2); opacity: 0; }
}
@keyframes fx-flash-anim {
  0% { transform: scale(0); opacity: 1; }
  30% { transform: scale(1.4); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}
@keyframes fx-spark-anim {
  0% { transform: rotate(var(--angle)) translateY(-15px) scale(0); opacity: 1; }
  30% { transform: rotate(var(--angle)) translateY(-40px) scale(1.2); opacity: 1; }
  100% { transform: rotate(var(--angle)) translateY(-65px) scale(0.4); opacity: 0; }
}
</style>
