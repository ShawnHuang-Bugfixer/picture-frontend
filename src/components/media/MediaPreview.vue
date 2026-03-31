<template>
  <div
    class="media-preview"
    :class="[
      `media-preview--${fit}`,
      `media-preview--radius-${radius}`,
      { 'media-preview--interactive': interactive },
    ]"
    :style="previewStyle"
  >
    <video
      v-if="isVideo"
      :src="src"
      :poster="thumbnailSrc"
      :controls="controls"
      :muted="muted"
      :playsinline="playsinline"
      preload="metadata"
      class="media-preview__asset"
    />
    <img v-else :src="src" :alt="alt" class="media-preview__asset" />
    <div v-if="showOverlay" class="media-preview__overlay" />
    <div v-if="showVideoBadge && isVideo" class="media-preview__badge">
      <CaretRightFilled />
      <span>{{ videoBadgeLabel }}</span>
    </div>
    <div v-if="$slots.default" class="media-preview__extra">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { CaretRightFilled } from '@ant-design/icons-vue'
import { computed } from 'vue'

interface Props {
  src?: string
  thumbnailSrc?: string
  alt?: string
  isVideo?: boolean
  fit?: 'cover' | 'contain'
  ratio?: string
  radius?: 'default' | 'none'
  controls?: boolean
  muted?: boolean
  playsinline?: boolean
  interactive?: boolean
  showOverlay?: boolean
  showVideoBadge?: boolean
  videoBadgeLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  thumbnailSrc: '',
  alt: '',
  isVideo: false,
  fit: 'cover',
  ratio: '4 / 3',
  radius: 'default',
  controls: false,
  muted: true,
  playsinline: true,
  interactive: false,
  showOverlay: false,
  showVideoBadge: true,
  videoBadgeLabel: 'Video',
})

const previewStyle = computed(() => {
  return props.ratio ? { aspectRatio: props.ratio } : undefined
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.media-preview {
  position: relative;
  overflow: hidden;
  border: 1px solid @media-border;
  border-radius: @media-radius;
  background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.1), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(247, 247, 248, 0.96) 100%);
  box-shadow: @media-shadow;
}

.media-preview--radius-none {
  border-radius: 0;
}

.media-preview--interactive {
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;
}

.media-preview--interactive:hover {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.16);
  box-shadow: @media-shadow-hover;
}

.media-preview__asset {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-preview--contain .media-preview__asset {
  object-fit: contain;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(243, 244, 246, 0.92) 100%);
}

.media-preview__overlay,
.media-preview__extra {
  position: absolute;
  inset: 0;
}

.media-preview__overlay {
  background: @media-overlay;
  pointer-events: none;
}

.media-preview__extra {
  pointer-events: none;
}

.media-preview__badge {
  position: absolute;
  top: 14px;
  left: 14px;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 7px 10px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: @border-radius-pill;
  background: rgba(15, 23, 42, 0.58);
  color: @text-inverse;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  backdrop-filter: blur(14px);
}

@media (max-width: 768px) {
  .media-preview {
    border-radius: @media-radius-sm;
  }

  .media-preview--radius-none {
    border-radius: 0;
  }
}
</style>
