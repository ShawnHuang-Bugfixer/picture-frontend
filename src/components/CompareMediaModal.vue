<template>
  <a-modal
    :open="open"
    :title="title || '超分结果对比'"
    :footer="null"
    :width="980"
    centered
    @cancel="emit('close')"
  >
    <div class="compare-modal">
      <div v-if="!beforeUrl || !afterUrl" class="compare-modal__empty">
        <a-empty description="缺少对比文件地址" />
      </div>

      <div
        v-else-if="beforeLoadError || afterLoadError"
        class="compare-modal__empty compare-modal__empty--error"
      >
        <a-empty
          :description="mediaType === 'video' ? '视频加载失败，请稍后重试' : '图片加载失败，请稍后重试'"
        />
      </div>

      <div v-else-if="mediaType === 'video'" class="compare-video-panel">
        <div
          ref="stageRef"
          class="compare-stage compare-stage--video"
          :style="videoStageStyle"
        >
          <video
            ref="beforeVideoRef"
            :src="beforeUrl"
            class="compare-stage__video"
            preload="metadata"
            playsinline
            @error="beforeLoadError = true"
            @loadedmetadata="handleVideoLoaded"
            @play="syncPlay"
            @pause="syncPause"
            @seeking="syncCurrentTime(true)"
            @seeked="syncCurrentTime(true)"
            @ratechange="syncPlaybackRate"
            @timeupdate="handleBeforeTimeUpdate"
            @ended="handleEnded"
          />

          <div class="compare-stage__after" :style="afterMaskStyle">
            <video
              ref="afterVideoRef"
              :src="afterUrl"
              class="compare-stage__video compare-stage__video--overlay"
              preload="metadata"
              muted
              playsinline
              tabindex="-1"
              @error="afterLoadError = true"
              @loadedmetadata="handleVideoLoaded"
            />
          </div>

          <div class="compare-stage__drag-surface" @pointerdown="handlePointerDown" />
          <div class="compare-stage__label compare-stage__label--before">原视频</div>
          <div class="compare-stage__label compare-stage__label--after">超分后</div>

          <div class="compare-stage__divider" :style="dividerStyle">
            <div class="compare-stage__handle">
              <span />
              <span />
            </div>
          </div>
        </div>

        <div class="compare-video-controls">
          <button class="compare-video-controls__play" type="button" @click="togglePlayback">
            {{ isPlaying ? '暂停' : '播放' }}
          </button>
          <span class="compare-video-controls__time">{{ formattedCurrentTime }}</span>
          <input
            class="compare-video-controls__range"
            type="range"
            min="0"
            :max="duration || 0"
            :value="currentTime"
            step="0.01"
            @input="handleSeekInput"
            @change="handleSeekChange"
          />
          <span class="compare-video-controls__time">{{ formattedDuration }}</span>
        </div>
      </div>

      <div v-else ref="stageRef" class="compare-stage" @pointerdown="handlePointerDown">
        <img
          :src="beforeUrl"
          alt="before"
          class="compare-stage__image"
          draggable="false"
          @error="beforeLoadError = true"
        />
        <div class="compare-stage__after" :style="afterMaskStyle">
          <img
            :src="afterUrl"
            alt="after"
            class="compare-stage__image"
            draggable="false"
            @error="afterLoadError = true"
          />
        </div>

        <div class="compare-stage__label compare-stage__label--before">原图</div>
        <div class="compare-stage__label compare-stage__label--after">超分后</div>

        <div class="compare-stage__divider" :style="dividerStyle">
          <div class="compare-stage__handle">
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

interface Props {
  open: boolean
  beforeUrl?: string
  afterUrl?: string
  mediaType?: 'image' | 'video'
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  beforeUrl: '',
  afterUrl: '',
  mediaType: 'image',
  title: '',
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const stageRef = ref<HTMLElement | null>(null)
const beforeVideoRef = ref<HTMLVideoElement | null>(null)
const afterVideoRef = ref<HTMLVideoElement | null>(null)
const sliderRatio = ref(0.5)
const beforeLoadError = ref(false)
const afterLoadError = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isPlaying = ref(false)
const isSeeking = ref(false)
const videoAspectRatio = ref('16 / 9')
let activePointerId: number | null = null

const dividerStyle = computed(() => ({
  left: `${sliderRatio.value * 100}%`,
}))

const afterMaskStyle = computed(() => ({
  clipPath: `inset(0 0 0 ${sliderRatio.value * 100}%)`,
}))

const videoStageStyle = computed(() => ({
  aspectRatio: videoAspectRatio.value,
}))

const formattedCurrentTime = computed(() => formatTime(currentTime.value))
const formattedDuration = computed(() => formatTime(duration.value))

const resetState = () => {
  sliderRatio.value = 0.5
  beforeLoadError.value = false
  afterLoadError.value = false
  currentTime.value = 0
  duration.value = 0
  isPlaying.value = false
  isSeeking.value = false
  videoAspectRatio.value = '16 / 9'
}

const pauseVideos = () => {
  beforeVideoRef.value?.pause()
  afterVideoRef.value?.pause()
  isPlaying.value = false
}

const resetVideos = async () => {
  await nextTick()
  pauseVideos()
  if (beforeVideoRef.value) {
    beforeVideoRef.value.currentTime = 0
    beforeVideoRef.value.playbackRate = 1
  }
  if (afterVideoRef.value) {
    afterVideoRef.value.currentTime = 0
    afterVideoRef.value.playbackRate = 1
  }
}

watch(
  () => [props.open, props.beforeUrl, props.afterUrl, props.mediaType],
  async () => {
    resetState()
    if (props.mediaType === 'video') {
      await resetVideos()
    }
  },
)

const updateRatioByClientX = (clientX: number) => {
  if (!stageRef.value) return
  const rect = stageRef.value.getBoundingClientRect()
  if (!rect.width) return
  const nextRatio = (clientX - rect.left) / rect.width
  sliderRatio.value = Math.min(1, Math.max(0, nextRatio))
}

const handlePointerMove = (event: PointerEvent) => {
  if (activePointerId !== event.pointerId) return
  updateRatioByClientX(event.clientX)
}

const stopPointerDrag = (event?: PointerEvent) => {
  if (event && activePointerId !== event.pointerId) return
  activePointerId = null
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('pointerup', stopPointerDrag)
  window.removeEventListener('pointercancel', stopPointerDrag)
}

const handlePointerDown = (event: PointerEvent) => {
  activePointerId = event.pointerId
  updateRatioByClientX(event.clientX)
  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', stopPointerDrag)
  window.addEventListener('pointercancel', stopPointerDrag)
}

const syncCurrentTime = (force = false) => {
  const beforeVideo = beforeVideoRef.value
  const afterVideo = afterVideoRef.value
  if (!beforeVideo || !afterVideo) return
  if (!Number.isFinite(beforeVideo.currentTime)) return
  if (force || Math.abs(afterVideo.currentTime - beforeVideo.currentTime) > 0.12) {
    afterVideo.currentTime = beforeVideo.currentTime
  }
}

const syncPlaybackRate = () => {
  const beforeVideo = beforeVideoRef.value
  const afterVideo = afterVideoRef.value
  if (!beforeVideo || !afterVideo) return
  afterVideo.playbackRate = beforeVideo.playbackRate
}

const syncPlay = async () => {
  const beforeVideo = beforeVideoRef.value
  const afterVideo = afterVideoRef.value
  if (!beforeVideo || !afterVideo) return
  isPlaying.value = true
  syncPlaybackRate()
  syncCurrentTime(true)
  try {
    await afterVideo.play()
  } catch {
    isPlaying.value = !beforeVideo.paused
  }
}

const syncPause = () => {
  pauseVideos()
  syncCurrentTime(true)
}

const handleBeforeTimeUpdate = () => {
  syncCurrentTime(false)
  if (!isSeeking.value && beforeVideoRef.value) {
    currentTime.value = beforeVideoRef.value.currentTime
  }
}

const handleVideoLoaded = (event: Event) => {
  const video = event.target as HTMLVideoElement
  if (video === beforeVideoRef.value) {
    duration.value = Number.isFinite(video.duration) ? video.duration : 0
    if (video.videoWidth && video.videoHeight) {
      videoAspectRatio.value = `${video.videoWidth} / ${video.videoHeight}`
    }
    currentTime.value = video.currentTime
  }
  syncPlaybackRate()
  syncCurrentTime(true)
}

const seekTo = (time: number) => {
  const beforeVideo = beforeVideoRef.value
  const afterVideo = afterVideoRef.value
  if (!beforeVideo || !afterVideo) return
  const nextTime = Math.max(0, Math.min(time, duration.value || 0))
  beforeVideo.currentTime = nextTime
  afterVideo.currentTime = nextTime
  currentTime.value = nextTime
}

const handleSeekInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  isSeeking.value = true
  seekTo(Number(target.value))
}

const handleSeekChange = () => {
  isSeeking.value = false
  syncCurrentTime(true)
}

const togglePlayback = async () => {
  const beforeVideo = beforeVideoRef.value
  if (!beforeVideo) return
  if (beforeVideo.paused) {
    try {
      await beforeVideo.play()
    } catch {
      isPlaying.value = false
    }
    return
  }
  beforeVideo.pause()
}

const handleEnded = () => {
  isPlaying.value = false
  currentTime.value = duration.value
  syncCurrentTime(true)
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '00:00'
  }
  const totalSeconds = Math.floor(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

onBeforeUnmount(() => {
  stopPointerDrag()
  pauseVideos()
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.compare-modal {
  min-height: 420px;
}

.compare-modal__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 420px;
}

.compare-video-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compare-stage {
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 420px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: @border-radius-lg;
  background: linear-gradient(45deg, rgba(15, 23, 42, 0.04) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(15, 23, 42, 0.04) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(15, 23, 42, 0.04) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(15, 23, 42, 0.04) 75%);
  background-position:
    0 0,
    0 12px,
    12px -12px,
    -12px 0;
  background-size: 24px 24px;
  touch-action: none;
  user-select: none;
}

.compare-stage--video {
  min-height: 0;
  background: #020617;
}

.compare-stage__image,
.compare-stage__video,
.compare-stage__after {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.compare-stage__image,
.compare-stage__video {
  object-fit: contain;
}

.compare-stage__video--overlay {
  pointer-events: none;
}

.compare-stage__drag-surface {
  position: absolute;
  inset: 0;
  z-index: 3;
  cursor: ew-resize;
}

.compare-stage__label {
  position: absolute;
  top: 16px;
  z-index: 5;
  padding: 6px 12px;
  border-radius: @border-radius-pill;
  background: rgba(15, 23, 42, 0.72);
  color: @text-inverse;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.compare-stage__label--before {
  left: 16px;
}

.compare-stage__label--after {
  right: 16px;
}

.compare-stage__divider {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 6;
  width: 2px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.08);
  transform: translateX(-50%);
}

.compare-stage__handle {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 2px solid rgba(255, 255, 255, 0.98);
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.78);
  box-shadow: @shadow-lg;
  transform: translate(-50%, -50%);
}

.compare-stage__handle span {
  width: 2px;
  height: 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
}

.compare-video-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: @border-radius-lg;
  background: #0f172a;
  box-shadow: @shadow-sm;
}

.compare-video-controls__play {
  min-width: 72px;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: @border-radius-pill;
  background: rgba(255, 255, 255, 0.08);
  color: @text-inverse;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.compare-video-controls__play:hover {
  background: rgba(255, 255, 255, 0.14);
}

.compare-video-controls__time {
  min-width: 44px;
  color: rgba(255, 255, 255, 0.82);
  font-variant-numeric: tabular-nums;
}

.compare-video-controls__range {
  flex: 1;
  accent-color: #ffffff;
  cursor: pointer;
}

@media (max-width: 768px) {
  .compare-modal,
  .compare-modal__empty,
  .compare-stage {
    min-height: 320px;
  }

  .compare-stage__label {
    top: 12px;
    padding: 5px 10px;
    font-size: 11px;
  }

  .compare-stage__label--before {
    left: 12px;
  }

  .compare-stage__label--after {
    right: 12px;
  }

  .compare-video-controls {
    gap: 10px;
    padding: 10px 12px;
  }

  .compare-video-controls__play {
    min-width: 64px;
    padding: 7px 12px;
    font-size: 13px;
  }

  .compare-video-controls__time {
    min-width: 40px;
    font-size: 12px;
  }
}
</style>
