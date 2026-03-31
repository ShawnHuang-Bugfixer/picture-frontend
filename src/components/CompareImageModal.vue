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
      <div v-if="!beforeImageUrl || !afterImageUrl" class="compare-modal__empty">
        <a-empty description="缺少对比图片地址" />
      </div>

      <div
        v-else-if="beforeLoadError || afterLoadError"
        class="compare-modal__empty compare-modal__empty--error"
      >
        <a-empty description="图片加载失败，请稍后重试" />
      </div>

      <div v-else ref="stageRef" class="compare-stage" @pointerdown="handlePointerDown">
        <img
          :src="beforeImageUrl"
          alt="before"
          class="compare-stage__image"
          draggable="false"
          @error="beforeLoadError = true"
        />
        <div class="compare-stage__after" :style="afterMaskStyle">
          <img
            :src="afterImageUrl"
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
import { computed, onBeforeUnmount, ref, watch } from 'vue'

interface Props {
  open: boolean
  beforeImageUrl?: string
  afterImageUrl?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  beforeImageUrl: '',
  afterImageUrl: '',
  title: '',
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const stageRef = ref<HTMLElement | null>(null)
const sliderRatio = ref(0.5)
const beforeLoadError = ref(false)
const afterLoadError = ref(false)
let activePointerId: number | null = null

const dividerStyle = computed(() => ({
  left: `${sliderRatio.value * 100}%`,
}))

const afterMaskStyle = computed(() => ({
  clipPath: `inset(0 0 0 ${sliderRatio.value * 100}%)`,
}))

const resetState = () => {
  sliderRatio.value = 0.5
  beforeLoadError.value = false
  afterLoadError.value = false
}

watch(
  () => [props.open, props.beforeImageUrl, props.afterImageUrl],
  () => {
    resetState()
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

onBeforeUnmount(() => {
  stopPointerDrag()
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

.compare-stage__image,
.compare-stage__after {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.compare-stage__image {
  object-fit: contain;
}

.compare-stage__label {
  position: absolute;
  top: 16px;
  z-index: 3;
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
  z-index: 4;
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
}
</style>
