<template>
  <a-modal
    class="image-out-painting"
    v-model:visible="visible"
    title="AI 扩图"
    :footer="false"
    @cancel="closeModal"
  >
    <a-row gutter="16">
      <a-col span="12">
        <h4>原始素材</h4>
        <img :src="picture?.url" :alt="picture?.name" style="max-width: 100%" />
      </a-col>
      <a-col span="12">
        <h4>扩图结果</h4>
        <img v-if="resultImageUrl" :src="resultImageUrl" :alt="picture?.name" style="max-width: 100%" />
      </a-col>
    </a-row>
    <div style="margin-bottom: 16px" />
    <a-flex justify="center" gap="16">
      <a-button type="primary" :loading="!!taskId" ghost @click="createTask">生成结果</a-button>
      <a-button v-if="resultImageUrl" type="primary" :loading="uploadLoading" @click="handleUpload">
        应用结果
      </a-button>
    </a-flex>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import {
  createPictureOutPaintingTaskUsingPost,
  getPictureOutPaintingTaskUsingGet,
  uploadPictureByUrlUsingPost,
} from '@/api/pictureController.ts'
import { getOnceTokenUsingGet } from '@/api/userController.ts'

interface Props {
  picture?: API.PictureVO
  spaceId?: number
  onSuccess?: (newPicture: API.PictureVO) => void
}

const props = defineProps<Props>()

const resultImageUrl = ref('')
const taskId = ref<string>()
const uploadLoading = ref(false)
const visible = ref(false)
let pollingTimer: ReturnType<typeof setInterval> | undefined

const createTask = async () => {
  if (!props.picture?.id) return

  const res = await createPictureOutPaintingTaskUsingPost({
    pictureId: props.picture.id,
    parameters: {
      xScale: 2,
      yScale: 2,
    },
  })

  if (res.data.code === 0 && res.data.data?.output?.taskId) {
    taskId.value = res.data.data.output.taskId
    message.success('扩图任务已创建，请稍候查看结果')
    startPolling()
    return
  }
  message.error('扩图任务失败，' + res.data.message)
}

const startPolling = () => {
  if (!taskId.value) return

  pollingTimer = setInterval(async () => {
    try {
      const res = await getPictureOutPaintingTaskUsingGet({
        taskId: taskId.value as string,
      })
      if (res.data.code === 0 && res.data.data?.output) {
        const taskResult = res.data.data.output
        if (taskResult.taskStatus === 'SUCCEEDED') {
          message.success('扩图任务执行成功')
          resultImageUrl.value = String(taskResult.outputImageUrl || '')
          clearPolling()
        } else if (taskResult.taskStatus === 'FAILED') {
          message.error('扩图任务执行失败')
          clearPolling()
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '请稍后重试'
      message.error('扩图任务轮询失败，' + errorMessage)
      clearPolling()
    }
  }, 3000)
}

const clearPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = undefined
    taskId.value = undefined
  }
}

const handleUpload = async () => {
  uploadLoading.value = true
  try {
    const tokenRes = await getOnceTokenUsingGet()
    if (tokenRes.data.code !== 0 || !tokenRes.data.data) {
      message.error('获取一次性 Token 失败，' + tokenRes.data.message)
      uploadLoading.value = false
      return
    }

    const params: API.PictureUploadRequest = {
      fileUrl: resultImageUrl.value,
      spaceId: props.spaceId,
    }
    if (props.picture) {
      params.id = props.picture.id
    }
    const res = await uploadPictureByUrlUsingPost(params)
    if (res.data.code === 0 && res.data.data) {
      message.success('素材上传成功')
      props.onSuccess?.(res.data.data)
      closeModal()
      return
    }
    message.error('素材上传失败，' + res.data.message)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error('素材上传失败，' + errorMessage)
  }
  uploadLoading.value = false
}

const openModal = () => {
  visible.value = true
}

const closeModal = () => {
  visible.value = false
}

defineExpose({
  openModal,
})
</script>

<style>
.image-out-painting {
  text-align: center;
}
</style>
