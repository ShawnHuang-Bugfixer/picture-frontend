<template>
  <div class="picture-upload">
    <a-upload
      list-type="picture-card"
      :show-upload-list="false"
      :custom-request="handleUpload"
      :before-upload="beforeUpload"
      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/x-matroska,video/x-msvideo,video/webm,video/x-m4v,.mp4,.mov,.mkv,.avi,.webm,.m4v"
    >
      <video
        v-if="isVideoPicture && picture?.url"
        :src="picture?.url"
        class="preview-media"
        controls
      />
      <img v-else-if="picture?.url" :src="picture?.url" alt="preview" class="preview-media" />
      <div v-else>
        <loading-outlined v-if="loading" />
        <plus-outlined v-else />
        <div class="ant-upload-text">点击或拖拽上传图片 / 视频</div>
      </div>
    </a-upload>
  </div>
</template>

<script lang="ts" setup>
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
const loading = ref<boolean>(false)
const uploadMediaType = ref<'image' | 'video'>('image')
type UploadResponse = { data: API.BaseResponsePictureVO_ }

const imageTypeSet = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const videoExtSet = new Set(['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v'])

const isVideoPicture = computed(() => {
  const ext = (props.picture?.picFormat || '').toLowerCase()
  return videoExtSet.has(ext)
})

const getExt = (name: string) => {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ''
}

const checkFileType = (file: File) => {
  if (imageTypeSet.has(file.type)) {
    return 'image' as const
  }
  const ext = getExt(file.name)
  if (videoExtSet.has(ext) || file.type.startsWith('video/')) {
    return 'video' as const
  }
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
      message.success(uploadMediaType.value === 'video' ? '视频上传成功' : '图片上传成功')
      props.onSuccess?.(res.data.data)
    } else {
      message.error(`上传失败，${res.data.message || '请稍后重试'}`)
    }
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

  if (fileType === 'image') {
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB')
      return false
    }
  } else {
    const isLt200M = file.size / 1024 / 1024 <= 200
    if (!isLt200M) {
      message.error('视频大小不能超过 200MB')
      return false
    }
  }

  try {
    const res = await getOnceTokenUsingGet()
    if (res.data.code === 0 && res.data.data) {
      return true
    }
    message.error(`获取一次性 Token 失败，${res.data.message || '请稍后重试'}`)
    return false
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error(`获取一次性 Token 失败，${errorMessage}`)
    return false
  }
}
</script>

<style scoped>
.picture-upload :deep(.ant-upload) {
  width: 100% !important;
  height: 100% !important;
  min-width: 152px;
  min-height: 152px;
}

.preview-media {
  width: 100%;
  max-height: 480px;
  object-fit: contain;
}

.ant-upload-select-picture-card i {
  font-size: 32px;
  color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style>
