<template>
  <div class="url-picture-upload">
    <div class="url-shell">
      <a-input v-model:value="fileUrl" placeholder="输入图片 URL，提交到当前工作台或案例整理流程中" />
      <a-button type="primary" :loading="loading" @click="handleUpload">提交 URL</a-button>
    </div>
    <div class="preview-card">
      <img v-if="picture?.url" :src="picture.url" alt="preview" />
      <div v-else class="preview-empty">提交成功后，这里会显示当前素材预览。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { uploadPictureByUrlUsingPost } from '@/api/pictureController.ts'

interface Props {
  picture?: API.PictureVO
  spaceId?: string | number
  onSuccess?: (newPicture: API.PictureVO) => void
}

const props = defineProps<Props>()
const fileUrl = ref<string>()
const loading = ref(false)

const handleUpload = async () => {
  if (!fileUrl.value) {
    message.error('请输入图片 URL')
    return
  }

  loading.value = true
  try {
    const params: API.PictureUploadRequest = { fileUrl: fileUrl.value }
    params.spaceId = props.spaceId as any
    if (props.picture?.id) {
      params.id = props.picture.id
    }
    const res = await uploadPictureByUrlUsingPost(params)
    if (res.data.code === 0 && res.data.data) {
      message.success('素材上传成功')
      props.onSuccess?.(res.data.data)
      return
    }
    message.error('素材上传失败，' + res.data.message)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error('素材上传失败，' + errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.url-picture-upload {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.url-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.preview-card {
  display: grid;
  place-items: center;
  min-height: 280px;
  padding: 18px;
  border: 1px dashed @border-strong;
  border-radius: @border-radius-xl;
  background: @card-bg-soft;
}

.preview-card img {
  max-width: 100%;
  max-height: 460px;
  border-radius: @border-radius-lg;
}

.preview-empty {
  color: @text-secondary;
}
</style>
