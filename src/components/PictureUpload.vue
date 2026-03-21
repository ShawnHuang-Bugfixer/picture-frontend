<template>
  <div class="upload-panel">
    <a-upload
      class="upload-dropzone"
      list-type="picture-card"
      :show-upload-list="false"
      :custom-request="handleUpload"
      :before-upload="beforeUpload"
      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/x-matroska,video/x-msvideo,video/webm,video/x-m4v,.mp4,.mov,.mkv,.avi,.webm,.m4v"
    >
      <template v-if="picture?.url">
        <video v-if="isVideoPicture" :src="picture.url" class="preview-media" controls />
        <img v-else :src="picture.url" alt="preview" class="preview-media" />
      </template>
      <div v-else class="upload-placeholder">
        <loading-outlined v-if="loading" />
        <plus-outlined v-else />
        <h4>拖拽或点击上传素材</h4>
        <p>支持图片与视频，任务提交后可继续做裁剪、扩图和超分处理。</p>
      </div>
    </a-upload>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons-vue'
import type { UploadProps } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import { uploadPictureUsingPost } from '@/api/pictureController.ts'
import { getOnceTokenUsingGet } from '@/api/userController.ts'

interface Props {
  picture?: API.PictureVO
  spaceId?: number
  onSuccess?: (newPicture: API.PictureVO) => void
}

const props = defineProps<Props>()
const loading = ref(false)
const uploadMediaType = ref<'image' | 'video'>('image')
type UploadResponse = { data: API.BaseResponsePictureVO_ }

const imageTypeSet = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const videoExtSet = new Set(['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v'])

const isVideoPicture = computed(() => {
  const ext = (props.picture?.picFormat || '').toLowerCase()
  return videoExtSet.has(ext)
})

const getExt = (name: string) => {
  const index = name.lastIndexOf('.')
  return index >= 0 ? name.slice(index + 1).toLowerCase() : ''
}

const checkFileType = (file: File) => {
  if (imageTypeSet.has(file.type)) return 'image' as const
  const ext = getExt(file.name)
  if (videoExtSet.has(ext) || file.type.startsWith('video/')) return 'video' as const
  return undefined
}

const handleUpload = async ({ file }: { file: File }) => {
  loading.value = true
  try {
    const params: API.PictureUploadRequest = props.picture ? { id: props.picture.id } : {}
    params.spaceId = props.spaceId
    const body = uploadMediaType.value === 'video' ? { mediaType: 'video' } : {}
    const res = (await uploadPictureUsingPost(params, body, file)) as UploadResponse
    if (res.data.code === 0 && res.data.data) {
      message.success(uploadMediaType.value === 'video' ? '视频上传成功' : '素材上传成功')
      props.onSuccess?.(res.data.data)
      return
    }
    message.error(`上传失败，${res.data.message || '请稍后重试'}`)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error(`上传失败，${errorMessage}`)
  } finally {
    loading.value = false
  }
}

const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
  const fileType = checkFileType(file as File)
  if (!fileType) {
    message.error('仅支持图片（jpg/png/webp/gif）或视频（mp4/mov/mkv/avi/webm/m4v）')
    return false
  }

  uploadMediaType.value = fileType

  if (fileType === 'image' && file.size / 1024 / 1024 >= 2) {
    message.error('图片大小不能超过 2MB')
    return false
  }

  if (fileType === 'video' && file.size / 1024 / 1024 > 200) {
    message.error('视频大小不能超过 200MB')
    return false
  }

  try {
    const res = await getOnceTokenUsingGet()
    if (res.data.code === 0 && res.data.data) {
      return true
    }
    message.error(`获取一次性 Token 失败，${res.data.message || '请稍后重试'}`)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error(`获取一次性 Token 失败，${errorMessage}`)
  }

  return false
}
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.upload-panel {
  width: 100%;
}

.upload-dropzone :deep(.ant-upload) {
  width: 100% !important;
  height: auto !important;
  min-height: 360px;
  border: 1px dashed @border-strong;
  border-radius: @border-radius-xl;
  background:
    radial-gradient(circle at top, rgba(37, 99, 235, 0.1), transparent 25%),
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  color: @text-secondary;
}

.upload-placeholder h4 {
  margin: 0;
  color: @text-color;
  font-size: 20px;
}

.upload-placeholder p {
  max-width: 360px;
  margin: 0;
  line-height: 1.7;
  text-align: center;
}

.preview-media {
  display: block;
  width: 100%;
  max-height: 520px;
  border-radius: @border-radius-lg;
  object-fit: contain;
}
</style>
