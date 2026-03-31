<template>
  <div id="pictureDetailPage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">素材详情</h2>
        <p class="app-page__subtitle">查看素材信息、下载与分享，并直接发起后续的编辑或超分处理。</p>
      </div>
      <div class="app-page__actions">
        <a-button type="primary" @click="doDownload">下载素材</a-button>
        <a-button @click="doShare">分享</a-button>
        <a-button @click="doSuperResolution">提交超分</a-button>
        <a-button v-if="canEdit" @click="doEdit">编辑</a-button>
        <a-button v-if="canDelete" danger @click="doDelete">删除</a-button>
      </div>
    </section>

    <section class="detail-grid">
      <div class="app-card media-card">
        <MediaPreview
          :src="picture.url || ''"
          :thumbnail-src="picture.thumbnailUrl || picture.url || ''"
          :alt="picture.name || '素材详情'"
          :is-video="isVideoPicture"
          fit="contain"
          ratio=""
          :controls="isVideoPicture"
          :muted="false"
          :playsinline="true"
          :show-overlay="false"
          class="detail-media"
        />
      </div>

      <div class="app-card info-card">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="作者">
            <a-space>
              <a-avatar :size="24" :src="picture.user?.userAvatar" />
              <span>{{ picture.user?.userName || '-' }}</span>
            </a-space>
          </a-descriptions-item>
          <a-descriptions-item label="名称">{{ picture.name ?? '未命名' }}</a-descriptions-item>
          <a-descriptions-item label="简介">{{ picture.introduction ?? '-' }}</a-descriptions-item>
          <a-descriptions-item label="分类">{{ picture.category ?? '默认' }}</a-descriptions-item>
          <a-descriptions-item label="标签">
            <a-space wrap>
              <a-tag v-for="tag in picture.tags" :key="tag">{{ tag }}</a-tag>
            </a-space>
          </a-descriptions-item>
          <a-descriptions-item label="格式">{{ picture.picFormat ?? '-' }}</a-descriptions-item>
          <a-descriptions-item label="宽度">{{ picture.picWidth ?? '-' }}</a-descriptions-item>
          <a-descriptions-item label="高度">{{ picture.picHeight ?? '-' }}</a-descriptions-item>
          <a-descriptions-item label="宽高比">{{ picture.picScale ?? '-' }}</a-descriptions-item>
          <a-descriptions-item label="大小">{{ formatSize(picture.picSize) }}</a-descriptions-item>
          <a-descriptions-item label="主色调">
            <a-space>
              <span>{{ picture.picColor ?? '-' }}</span>
              <div
                v-if="picture.picColor"
                class="color-chip"
                :style="{ backgroundColor: toHexColor(picture.picColor) }"
              />
            </a-space>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </section>

    <ShareModal ref="shareModalRef" title="分享素材" :link="shareLink" />
    <ImageSuperResolution
      ref="imageSuperResolutionRef"
      :picture="picture"
      :onSuccess="onSuperResolutionTaskCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { deletePictureUsingPost, getPictureVoByIdUsingGet } from '@/api/pictureController.ts'
import { getLoginUserUsingGet, getPermissionsUsingPost } from '@/api/userController.ts'
import ImageSuperResolution from '@/components/ImageSuperResolution.vue'
import MediaPreview from '@/components/media/MediaPreview.vue'
import ShareModal from '@/components/ShareModal.vue'
import { isVideoMedia } from '@/constants/srTask.ts'
import { SPACE_PERMISSION_ENUM } from '@/constants/space.ts'
import { downloadImage, formatSize, toHexColor } from '@/utils'

interface Props {
  id: string | number
}

const props = defineProps<Props>()
const router = useRouter()
const picture = ref<API.PictureVO>({})
const loginUser = ref<API.LoginUserVO>()
const permissionList = ref<string[]>([])
const shareModalRef = ref()
const imageSuperResolutionRef = ref()
const shareLink = ref('')

const isVideoPicture = computed(() => isVideoMedia(picture.value.picFormat))

const fetchLoginUser = async () => {
  const res = await getLoginUserUsingGet()
  if (res.data.code === 0 && res.data.data) {
    loginUser.value = res.data.data
  }
}

const fetchPermissions = async () => {
  if (!loginUser.value?.id) {
    return
  }
  try {
    const res = await getPermissionsUsingPost({
      spaceId: undefined,
      userId: loginUser.value.id,
      pictureId: props.id as any,
    })
    if (res.data.code === 0 && res.data.data) {
      permissionList.value = res.data.data
    }
  } catch (error) {
    console.error('获取权限失败:', error)
  }
}

const canEdit = computed(() => {
  if (!picture.value) {
    return false
  }
  if (!picture.value.spaceId) {
    return permissionList.value.includes(SPACE_PERMISSION_ENUM.PUBLIC_MODIFY_IMAGE)
  }
  if (picture.value.spaceType === 0) {
    return permissionList.value.includes(SPACE_PERMISSION_ENUM.PRIVATE_MODIFY_IMAGE)
  }
  return permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_MODIFY_IMAGE)
})

const canDelete = computed(() => {
  if (!picture.value) {
    return false
  }
  if (!picture.value.spaceId) {
    return permissionList.value.includes(SPACE_PERMISSION_ENUM.PUBLIC_DELETE_IMAGE)
  }
  if (picture.value.spaceType === 0) {
    return permissionList.value.includes(SPACE_PERMISSION_ENUM.PRIVATE_DELETE_IMAGE)
  }
  return permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_DELETE_IMAGE)
})

const fetchPictureDetail = async () => {
  try {
    const res = await getPictureVoByIdUsingGet({
      id: props.id as any,
    })
    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
      return
    }
    message.error(`获取素材详情失败，${res.data.message || '请稍后重试'}`)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error(`获取素材详情失败，${errorMessage}`)
  }
}

onMounted(async () => {
  await fetchLoginUser()
  await fetchPictureDetail()
})

watchEffect(() => {
  if (loginUser.value) {
    fetchPermissions()
  }
})

const doEdit = () => {
  router.push({
    path: '/add_picture',
    query: {
      id: picture.value.id,
      spaceId: picture.value.spaceId,
    },
  })
}

const doDelete = async () => {
  const id = picture.value.id
  if (!id) {
    return
  }
  const res = await deletePictureUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
    router.push('/')
    return
  }
  message.error('删除失败')
}

const doDownload = async () => {
  if (!picture.value.url) {
    return
  }
  try {
    const fileName = picture.value.name
      ? `${picture.value.name}.${picture.value.picFormat || 'jpg'}`
      : undefined
    await downloadImage(picture.value.url, fileName)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '请稍后重试'
    message.error(`下载素材失败，${errorMessage}`)
  }
}

const doShare = () => {
  shareLink.value = `${window.location.protocol}//${window.location.host}/picture/${picture.value.id}`
  shareModalRef.value?.openModal()
}

const doSuperResolution = () => {
  imageSuperResolutionRef.value?.openModal()
}

const onSuperResolutionTaskCreated = () => {
  if (picture.value.spaceId) {
    router.push(`/space/${picture.value.spaceId}/sr_result`)
    return
  }
  message.success('任务已提交，请稍后在结果中心查看')
}
</script>

<style scoped lang="less">
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
  gap: 20px;
}

.media-card,
.info-card {
  padding: 18px;
}

.detail-media {
  min-height: 420px;
}

.color-chip {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

@media (max-width: 1080px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
