<template>
  <div
    class="media-masonry-card"
    :class="{
      'media-masonry-card--revealed': revealed,
      'media-masonry-card--compact': usePopoverOverlay,
    }"
    @click="$emit('card-click', $event)"
  >
    <div ref="previewShellRef" class="media-masonry-card__preview-shell">
      <MediaPreview
        :src="src"
        :thumbnail-src="thumbnailSrc"
        :alt="alt"
        :is-video="isVideo"
        :video-preview-mode="videoPreviewMode"
        :ratio="previewRatio"
        radius="none"
        :interactive="true"
        :show-overlay="false"
        video-badge-label="Video"
      />

      <div v-if="$slots.corner" class="media-masonry-card__corner">
        <slot name="corner" />
      </div>
    </div>

    <div class="media-masonry-card__panel" :class="panelClass">
      <div v-if="eyebrow" class="media-masonry-card__eyebrow">{{ eyebrow }}</div>
      <div v-if="title" class="media-masonry-card__title">{{ title }}</div>
      <div v-if="subtitle" class="media-masonry-card__subtitle">{{ subtitle }}</div>
      <div v-if="$slots.meta" class="media-masonry-card__meta">
        <slot name="meta" />
      </div>
      <div v-if="$slots.actions" class="media-masonry-card__actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import MediaPreview from '@/components/media/MediaPreview.vue'

interface Props {
  src?: string
  thumbnailSrc?: string
  alt?: string
  title?: string
  subtitle?: string
  eyebrow?: string
  isVideo?: boolean
  videoPreviewMode?: 'player' | 'poster'
  previewWidth?: number | string
  previewHeight?: number | string
  revealed?: boolean
  overlayMode?: 'auto' | 'inside' | 'popover'
}

const COMPACT_OVERLAY_THRESHOLD = 220

const props = withDefaults(defineProps<Props>(), {
  src: '',
  thumbnailSrc: '',
  alt: '',
  title: '',
  subtitle: '',
  eyebrow: '',
  isVideo: false,
  videoPreviewMode: 'player',
  previewWidth: undefined,
  previewHeight: undefined,
  revealed: false,
  overlayMode: 'auto',
})

defineEmits<{
  (e: 'card-click', event: MouseEvent): void
}>()

const previewShellRef = ref<HTMLElement | null>(null)
const previewPixelHeight = ref(0)
let resizeObserver: ResizeObserver | null = null

const previewRatio = computed(() => {
  const width = Number(props.previewWidth)
  const height = Number(props.previewHeight)
  if (width > 0 && height > 0) {
    return `${width} / ${height}`
  }
  return '4 / 5'
})

const usePopoverOverlay = computed(() => {
  if (props.overlayMode === 'popover') {
    return true
  }
  if (props.overlayMode === 'inside') {
    return false
  }
  return previewPixelHeight.value > 0 && previewPixelHeight.value < COMPACT_OVERLAY_THRESHOLD
})

const panelClass = computed(() => ({
  'media-masonry-card__panel--inside': !usePopoverOverlay.value,
  'media-masonry-card__panel--popover': usePopoverOverlay.value,
}))

const updatePreviewHeight = () => {
  previewPixelHeight.value = previewShellRef.value?.getBoundingClientRect().height || 0
}

onMounted(() => {
  updatePreviewHeight()
  if ('ResizeObserver' in window && previewShellRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updatePreviewHeight()
    })
    resizeObserver.observe(previewShellRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.media-masonry-card {
  position: relative;
  width: 100%;
  cursor: pointer;
}

.media-masonry-card__preview-shell {
  position: relative;
  overflow: hidden;
  border-radius: 0;
}

.media-masonry-card__corner {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 5;
}

.media-masonry-card__panel {
  position: absolute;
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: @text-inverse;
  opacity: 0;
  transform: translateY(14px);
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
  pointer-events: none;
}

.media-masonry-card:hover .media-masonry-card__panel,
.media-masonry-card--revealed .media-masonry-card__panel {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.media-masonry-card__panel--inside {
  inset: auto 0 0;
  padding: 24px 16px 16px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.82) 44%);
}

.media-masonry-card__panel--popover {
  left: 12px;
  right: 12px;
  bottom: 12px;
  max-height: min(280px, 70vh);
  padding: 14px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: @border-radius-lg;
  background: rgba(15, 23, 42, 0.88);
  box-shadow: @shadow-xl;
  backdrop-filter: blur(18px);
}

.media-masonry-card__eyebrow {
  overflow: hidden;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.72);
}

.media-masonry-card__title {
  display: -webkit-box;
  overflow: hidden;
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.03em;
  word-break: break-word;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.media-masonry-card__subtitle {
  display: -webkit-box;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.82);
  word-break: break-word;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.media-masonry-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.media-masonry-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

@media (max-width: 768px) {
  .media-masonry-card__title {
    font-size: 18px;
  }

  .media-masonry-card__panel--inside {
    padding: 20px 14px 14px;
  }

  .media-masonry-card__panel--popover {
    left: 10px;
    right: 10px;
    bottom: 10px;
    padding: 12px;
  }
}
</style>
