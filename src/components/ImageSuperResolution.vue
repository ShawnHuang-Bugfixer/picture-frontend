<template>
  <a-modal
    v-model:open="visible"
    title="提交超分任务"
    :confirm-loading="submitLoading"
    ok-text="提交任务"
    cancel-text="取消"
    @ok="handleSubmit"
    @cancel="closeModal"
  >
    <a-form layout="vertical">
      <a-alert
        type="info"
        show-icon
        message="当前服务端模型已锁定"
        :description="`本次任务会使用 ${SR_LOCKED_MODEL_NAME}，前端仅透传模型字段用于协议兼容。`"
        style="margin-bottom: 16px"
      />

      <a-form-item label="素材 ID">
        <a-input :value="String(props.picture?.id ?? '')" disabled />
      </a-form-item>

      <a-form-item label="任务类型">
        <a-input :value="taskTypeLabel" disabled />
      </a-form-item>

      <a-form-item label="放大倍率">
        <a-radio-group v-model:value="formState.scale">
          <a-radio :value="2">2x</a-radio>
          <a-radio :value="4">4x</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="模型名称">
        <a-input :value="SR_LOCKED_MODEL_NAME" disabled />
      </a-form-item>

      <template v-if="isVideoTask">
        <a-form-item label="处理模式">
          <a-radio-group v-model:value="formState.videoMode">
            <a-radio value="default">按服务默认策略</a-radio>
            <a-radio value="stream">优先流式处理</a-radio>
            <a-radio value="extract">先抽帧再处理</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item label="保留音频">
          <a-switch v-model:checked="formState.keepAudio" />
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

        <a-typography-paragraph type="secondary" style="margin-bottom: 0">
          视频任务默认优先走流式处理。若服务端流式失败，会自动降级为抽帧模式重试。
        </a-typography-paragraph>
      </template>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { createSrTaskUsingPost } from '@/api/srTaskController.ts'
import { SR_DEFAULT_MODEL_VERSION, SR_LOCKED_MODEL_NAME, isVideoMedia } from '@/constants/srTask.ts'

interface Props {
  picture?: API.PictureVO
  onSuccess?: (taskId: string) => void
}

type VideoMode = 'default' | 'stream' | 'extract'

const props = defineProps<Props>()

const visible = ref(false)
const submitLoading = ref(false)

const isVideoTask = computed(() => isVideoMedia(props.picture?.picFormat))
const taskTypeLabel = computed(() => (isVideoTask.value ? '视频超分' : '图片超分'))

const formState = reactive({
  scale: 4 as 2 | 4,
  keepAudio: true,
  fpsOverride: undefined as number | undefined,
  videoMode: 'default' as VideoMode,
})

const getVideoOptions = () => {
  if (!isVideoTask.value) {
    return undefined
  }

  return {
    keepAudio: formState.keepAudio,
    ...(formState.videoMode === 'extract' ? { extractFrameFirst: true } : {}),
    ...(formState.videoMode === 'stream' ? { extractFrameFirst: false } : {}),
    ...(formState.fpsOverride !== undefined ? { fpsOverride: formState.fpsOverride } : {}),
  }
}

const resetForm = () => {
  formState.scale = 4
  formState.keepAudio = true
  formState.fpsOverride = undefined
  formState.videoMode = 'default'
}

const handleSubmit = async () => {
  if (!props.picture?.id) {
    message.error('缺少素材 ID，无法提交超分任务')
    return
  }
  if (formState.fpsOverride !== undefined && formState.fpsOverride <= 0) {
    message.error('覆盖帧率必须大于 0')
    return
  }

  submitLoading.value = true
  try {
    const res = await createSrTaskUsingPost({
      type: isVideoTask.value ? 'video' : 'image',
      pictureId: String(props.picture.id),
      scale: formState.scale,
      modelName: SR_LOCKED_MODEL_NAME,
      modelVersion: SR_DEFAULT_MODEL_VERSION,
      ...(isVideoTask.value ? { videoOptions: getVideoOptions() } : {}),
    })

    if (res.data.code === 0 && res.data.data) {
      const taskId = String(res.data.data)
      message.success(`超分任务已提交，任务 ID：${taskId}`)
      props.onSuccess?.(taskId)
      closeModal()
      return
    }
    message.error(`提交失败，${res.data.message || '请稍后重试'}`)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error(`提交失败，${errorMessage}`)
  } finally {
    submitLoading.value = false
  }
}

const openModal = () => {
  resetForm()
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
