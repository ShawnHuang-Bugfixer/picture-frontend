<template>
  <a-modal
    v-model:visible="visible"
    title="AI 超分"
    :confirm-loading="submitLoading"
    ok-text="提交任务"
    cancel-text="取消"
    @ok="handleSubmit"
    @cancel="closeModal"
  >
    <a-form layout="vertical">
      <a-form-item label="图片 ID">
        <a-input :value="String(props.picture?.id ?? '')" disabled />
      </a-form-item>
      <a-form-item label="放大倍率">
        <a-radio-group v-model:value="formState.scale">
          <a-radio :value="2">2x</a-radio>
          <a-radio :value="4">4x</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { createSrTaskUsingPost } from '@/api/srTaskController.ts'

interface Props {
  picture?: API.PictureVO
  onSuccess?: (taskId: string) => void
}

const props = defineProps<Props>()

const visible = ref(false)
const submitLoading = ref(false)
const formState = reactive({
  scale: 4 as 2 | 4,
})

const handleSubmit = async () => {
  if (!props.picture?.id) {
    message.error('缺少图片 ID，无法提交超分任务')
    return
  }
  submitLoading.value = true
  try {
    const res = await createSrTaskUsingPost({
      pictureId: String(props.picture.id),
      scale: formState.scale,
      modelName: 'RealESRGAN_x4plus',
      modelVersion: 'v1.0.0',
    })
    if (res.data.code === 0 && res.data.data) {
      const taskId = String(res.data.data)
      message.success(`超分任务已提交，任务 ID：${taskId}`)
      props.onSuccess?.(taskId)
      closeModal()
    } else {
      message.error(`提交失败：${res.data.message || '请稍后重试'}`)
    }
  } catch (error: any) {
    message.error(`提交失败：${error?.message || '请稍后重试'}`)
  } finally {
    submitLoading.value = false
  }
}

const openModal = () => {
  formState.scale = 4
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
