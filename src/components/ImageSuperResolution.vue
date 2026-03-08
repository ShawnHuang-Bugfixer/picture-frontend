<template>
  <a-modal
    v-model:open="visible"
    title="AI 超分"
    :confirm-loading="submitLoading"
    ok-text="提交任务"
    cancel-text="取消"
    @ok="handleSubmit"
    @cancel="closeModal"
  >
    <a-form layout="vertical">
      <a-form-item label="资源 ID">
        <a-input :value="String(props.picture?.id ?? '')" disabled />
      </a-form-item>
      <a-form-item label="任务类型">
        <a-input :value="isVideoTask ? 'video' : 'image'" disabled />
      </a-form-item>
      <a-form-item label="放大倍率">
        <a-radio-group v-model:value="formState.scale">
          <a-radio :value="2">2x</a-radio>
          <a-radio :value="4">4x</a-radio>
        </a-radio-group>
      </a-form-item>

      <template v-if="isVideoTask">
        <a-form-item label="模型名称">
          <a-select
            v-model:value="formState.modelName"
            :options="videoModelOptions"
            placeholder="请选择视频超分模型"
          />
        </a-form-item>
        <a-form-item label="保留音频">
          <a-switch v-model:checked="formState.keepAudio" />
        </a-form-item>
        <a-form-item label="先抽帧再处理">
          <a-switch v-model:checked="formState.extractFrameFirst" />
        </a-form-item>
        <a-form-item label="覆盖帧率（可选）">
          <a-input-number
            v-model:value="formState.fpsOverride"
            :min="0.001"
            :step="0.001"
            :precision="3"
            style="width: 100%"
            placeholder="例如 23.976"
          />
        </a-form-item>
      </template>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { createSrTaskUsingPost } from '@/api/srTaskController.ts'

interface Props {
  picture?: API.PictureVO
  onSuccess?: (taskId: string) => void
}

const props = defineProps<Props>()

const visible = ref(false)
const submitLoading = ref(false)
const videoExtSet = new Set(['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v'])
const videoModelOptions = [
  { label: 'realesr-animevideov3', value: 'realesr-animevideov3' },
  { label: 'RealESRGAN_x4plus', value: 'RealESRGAN_x4plus' },
]

const isVideoTask = computed(() => {
  const ext = (props.picture?.picFormat || '').toLowerCase()
  return videoExtSet.has(ext)
})

const formState = reactive({
  scale: 4 as 2 | 4,
  modelName: 'realesr-animevideov3',
  modelVersion: 'v1.0.0',
  keepAudio: true,
  extractFrameFirst: true,
  fpsOverride: undefined as number | undefined,
})

const handleSubmit = async () => {
  if (!props.picture?.id) {
    message.error('缺少资源 ID，无法提交超分任务')
    return
  }
  if (formState.fpsOverride !== undefined && formState.fpsOverride <= 0) {
    message.error('fpsOverride 必须大于 0')
    return
  }

  submitLoading.value = true
  try {
    const body = isVideoTask.value
      ? {
          type: 'video' as const,
          pictureId: String(props.picture.id),
          scale: formState.scale,
          modelName: formState.modelName,
          modelVersion: formState.modelVersion,
          videoOptions: {
            keepAudio: formState.keepAudio,
            extractFrameFirst: formState.extractFrameFirst,
            ...(formState.fpsOverride !== undefined ? { fpsOverride: formState.fpsOverride } : {}),
          },
        }
      : {
          type: 'image' as const,
          pictureId: String(props.picture.id),
          scale: formState.scale,
          modelName: 'RealESRGAN_x4plus',
          modelVersion: formState.modelVersion,
        }
    const res = await createSrTaskUsingPost(body)
    if (res.data.code === 0 && res.data.data) {
      const taskId = String(res.data.data)
      message.success(`超分任务已提交，任务 ID：${taskId}`)
      props.onSuccess?.(taskId)
      closeModal()
    } else {
      message.error(`提交失败，${res.data.message || '请稍后重试'}`)
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error(`提交失败，${errorMessage}`)
  } finally {
    submitLoading.value = false
  }
}

const openModal = () => {
  formState.scale = 4
  formState.modelVersion = 'v1.0.0'
  if (isVideoTask.value) {
    formState.modelName = 'realesr-animevideov3'
    formState.keepAudio = true
    formState.extractFrameFirst = true
    formState.fpsOverride = undefined
  }
  visible.value = true
}

const closeModal = () => {
  visible.value = false
}

defineExpose({
  openModal,
  closeModal,
})
</script>
