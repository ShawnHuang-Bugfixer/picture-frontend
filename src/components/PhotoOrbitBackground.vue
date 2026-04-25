<template>
  <div
    class="photo-orbit-bg"
    :class="{ 'photo-orbit-bg--paused': paused }"
    :style="rootStyle"
    aria-hidden="true"
  >
    <div class="photo-orbit-bg__glow"></div>
    <div class="photo-orbit-bg__mask"></div>
    <div class="photo-orbit-bg__stage">
      <div
        v-for="(item, index) in visibleItems"
        :key="`${item.title}-${index}`"
        class="photo-orbit-bg__track"
        :style="getTrackStyle(index)"
      >
        <article
          class="photo-orbit-bg__card"
          :class="[`photo-orbit-bg__card--${item.tone || 'slate'}`]"
          :style="getCardStyle(index)"
        >
          <div v-if="item.image" class="photo-orbit-bg__image">
            <img :src="item.image" :alt="item.title" loading="lazy" />
          </div>
          <div v-else class="photo-orbit-bg__fallback">
            <span class="photo-orbit-bg__index">{{ String(index + 1).padStart(2, '0') }}</span>
            <span class="photo-orbit-bg__shine"></span>
          </div>
          <div class="photo-orbit-bg__content">
            <strong>{{ item.title }}</strong>
            <span>{{ item.meta }}</span>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'

type OrbitTone =
  | 'blue'
  | 'cyan'
  | 'slate'
  | 'green'
  | 'amber'
  | 'rose'
  | 'indigo'
  | 'violet'
  | 'teal'
  | 'orange'

export interface PhotoOrbitItem {
  image?: string
  title: string
  meta: string
  tone?: OrbitTone
}

const props = withDefaults(
  defineProps<{
    items: PhotoOrbitItem[]
    orbitWidth?: number
    orbitHeight?: number
    speed?: number
    cardWidth?: number
    cardHeight?: number
    opacity?: number
    blurStrength?: number
    paused?: boolean
  }>(),
  {
    orbitWidth: 1180,
    orbitHeight: 560,
    speed: 42,
    cardWidth: 300,
    cardHeight: 188,
    opacity: 0.94,
    blurStrength: 1.8,
    paused: false,
  },
)

const visibleItems = computed(() => props.items.slice(0, 10))

const rootStyle = computed(
  () =>
    ({
      '--orbit-width': `${props.orbitWidth}px`,
      '--orbit-height': `${props.orbitHeight}px`,
      '--orbit-scale-y': props.orbitHeight / props.orbitWidth,
      '--orbit-scale-y-inverse': props.orbitWidth / props.orbitHeight,
      '--orbit-speed': `${props.speed}s`,
      '--card-width': `${props.cardWidth}px`,
      '--card-height': `${props.cardHeight}px`,
      '--orbit-opacity': props.opacity,
      '--blur-strength': `${props.blurStrength}px`,
    }) as CSSProperties,
)

const getTrackStyle = (index: number): CSSProperties => {
  const count = visibleItems.value.length || 1
  const angle = (360 / count) * index - 18
  const delay = -(props.speed / count) * index

  return {
    '--start-angle': `${angle}deg`,
    '--orbit-delay': `${delay}s`,
  } as CSSProperties
}

const getCardStyle = (index: number): CSSProperties => {
  const count = visibleItems.value.length || 1
  const angle = ((Math.PI * 2) / count) * index
  const depth = (Math.sin(angle) + 1) / 2
  const scale = 0.86 + depth * 0.18
  const opacity = 0.56 + depth * 0.34
  const blur = (1 - depth) * props.blurStrength
  const rotate = -8 + depth * 16
  const tilt = rotate * -0.36

  return {
    '--card-scale': scale,
    '--card-opacity': opacity,
    '--card-blur': `${blur}px`,
    '--card-rotate': `${rotate}deg`,
    '--card-tilt': `${tilt}deg`,
  } as CSSProperties
}
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.photo-orbit-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: var(--orbit-opacity);
  perspective: 1200px;
}

.photo-orbit-bg__glow {
  position: absolute;
  left: -12%;
  top: 4%;
  width: 62%;
  height: 70%;
  background:
    radial-gradient(circle at 48% 45%, rgba(59, 130, 246, 0.26), transparent 38%),
    radial-gradient(circle at 40% 60%, rgba(20, 184, 166, 0.16), transparent 34%),
    radial-gradient(circle at 58% 40%, rgba(244, 114, 182, 0.12), transparent 30%);
  filter: blur(10px);
}

.photo-orbit-bg__mask {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(247, 247, 248, 0) 0%, rgba(247, 247, 248, 0.52) 58%, #f7f7f8 100%),
    linear-gradient(180deg, rgba(247, 247, 248, 0.22) 0%, rgba(247, 247, 248, 0) 40%);
}

.photo-orbit-bg__stage {
  position: absolute;
  left: clamp(420px, 43vw, 820px);
  top: 30%;
  width: var(--orbit-width);
  height: var(--orbit-width);
  transform: translate(-50%, -50%) rotateX(58deg) rotateZ(-10deg) scaleY(var(--orbit-scale-y));
  transform-style: preserve-3d;
}

.photo-orbit-bg__track {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
  transform-style: preserve-3d;
  animation: photo-orbit-track var(--orbit-speed) linear infinite;
  animation-delay: var(--orbit-delay);
}

.photo-orbit-bg__card {
  position: absolute;
  left: calc(var(--card-width) / -2);
  top: calc(var(--card-height) / -2);
  display: flex;
  flex-direction: column;
  width: var(--card-width);
  height: var(--card-height);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 22px 52px rgba(15, 23, 42, 0.16);
  opacity: var(--card-opacity);
  filter: blur(var(--card-blur));
  transform: translateX(calc(var(--orbit-width) / 2)) scaleY(var(--orbit-scale-y-inverse))
    rotateY(var(--card-rotate)) rotateZ(var(--card-tilt)) scale(var(--card-scale));
  transform-style: preserve-3d;
  backdrop-filter: blur(16px);
  will-change: transform, opacity, filter;
}

.photo-orbit-bg__image {
  position: absolute;
  inset: 0;
}

.photo-orbit-bg__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-orbit-bg__fallback {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(255, 255, 255, 0.1)),
    var(--orbit-tone);
}

.photo-orbit-bg__fallback::before {
  position: absolute;
  right: 20px;
  bottom: 18px;
  width: 72px;
  height: 72px;
  border: 1px solid rgba(255, 255, 255, 0.46);
  border-radius: 50%;
  content: '';
}

.photo-orbit-bg__index {
  position: absolute;
  left: 18px;
  top: 16px;
  color: rgba(255, 255, 255, 0.74);
  font-size: 11px;
  font-weight: 700;
}

.photo-orbit-bg__shine {
  position: absolute;
  inset: 24px auto auto 64px;
  width: 130px;
  height: 1px;
  background: rgba(255, 255, 255, 0.66);
}

.photo-orbit-bg__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: flex-end;
  padding: 20px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0) 24%, rgba(15, 23, 42, 0.48) 100%);
  color: #ffffff;
}

.photo-orbit-bg__content strong {
  font-size: 18px;
  line-height: 1.2;
}

.photo-orbit-bg__content span {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 14px;
  line-height: 1.2;
}

.photo-orbit-bg__card--blue {
  --orbit-tone: linear-gradient(135deg, #2563eb, #38bdf8);
}

.photo-orbit-bg__card--cyan {
  --orbit-tone: linear-gradient(135deg, #0891b2, #67e8f9);
}

.photo-orbit-bg__card--slate {
  --orbit-tone: linear-gradient(135deg, #334155, #94a3b8);
}

.photo-orbit-bg__card--green {
  --orbit-tone: linear-gradient(135deg, #15803d, #86efac);
}

.photo-orbit-bg__card--amber {
  --orbit-tone: linear-gradient(135deg, #d97706, #fde68a);
}

.photo-orbit-bg__card--rose {
  --orbit-tone: linear-gradient(135deg, #e11d48, #fda4af);
}

.photo-orbit-bg__card--indigo {
  --orbit-tone: linear-gradient(135deg, #4f46e5, #a5b4fc);
}

.photo-orbit-bg__card--violet {
  --orbit-tone: linear-gradient(135deg, #7c3aed, #c4b5fd);
}

.photo-orbit-bg__card--teal {
  --orbit-tone: linear-gradient(135deg, #0f766e, #5eead4);
}

.photo-orbit-bg__card--orange {
  --orbit-tone: linear-gradient(135deg, #ea580c, #fdba74);
}

.photo-orbit-bg--paused .photo-orbit-bg__track {
  animation-play-state: paused;
}

@keyframes photo-orbit-track {
  from {
    transform: rotate(var(--start-angle));
  }

  to {
    transform: rotate(calc(var(--start-angle) + 360deg));
  }
}

@media (max-width: 960px) {
  .photo-orbit-bg {
    opacity: calc(var(--orbit-opacity) * 0.58);
  }

  .photo-orbit-bg__stage {
    left: 50%;
    top: 168px;
    width: min(520px, 92vw);
    height: min(520px, 92vw);
    transform: translate(-50%, -50%) rotateX(58deg) rotateZ(-12deg) scaleY(0.5);
  }

  .photo-orbit-bg__track:nth-child(n + 7) {
    display: none;
  }

  .photo-orbit-bg__card {
    width: 126px;
    height: 82px;
    filter: blur(calc(var(--card-blur) + 1px));
  }

  .photo-orbit-bg__mask {
    background:
      linear-gradient(180deg, rgba(247, 247, 248, 0.1) 0%, #f7f7f8 62%),
      linear-gradient(90deg, rgba(247, 247, 248, 0.26) 0%, rgba(247, 247, 248, 0.72) 100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .photo-orbit-bg__track {
    animation: none;
  }

  .photo-orbit-bg__track {
    transform: rotate(var(--start-angle));
  }
}
</style>
