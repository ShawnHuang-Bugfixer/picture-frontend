<template>
  <div id="pictureDetailPage">
    <a-row :gutter="[16, 16]">
      <!-- 图片预览 -->
      <a-col :sm="24" :md="16" :xl="18">
        <a-card title="图片预览">
          <a-image :src="picture.url" style="max-height: 600px; object-fit: contain" />
        </a-card>
      </a-col>
      <!-- 图片信息区域 -->
      <a-col :sm="24" :md="8" :xl="6">
        <a-card title="图片信息">
          <a-descriptions :column="1">
            <a-descriptions-item label="作者">
              <a-space>
                <a-avatar :size="24" :src="picture.user?.userAvatar" />
                <div>{{ picture.user?.userName }}</div>
              </a-space>
            </a-descriptions-item>
            <a-descriptions-item label="名称">
              {{ picture.name ?? '未命名' }}
            </a-descriptions-item>
            <a-descriptions-item label="简介">
              {{ picture.introduction ?? '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="分类">
              {{ picture.category ?? '默认' }}
            </a-descriptions-item>
            <a-descriptions-item label="标签">
              <a-tag v-for="tag in picture.tags" :key="tag">
                {{ tag }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="格式">
              {{ picture.picFormat ?? '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="宽度">
              {{ picture.picWidth ?? '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="高度">
              {{ picture.picHeight ?? '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="宽高比">
              {{ picture.picScale ?? '-' }}
            </a-descriptions-item>
            <a-descriptions-item label="大小">
              {{ formatSize(picture.picSize) }}
            </a-descriptions-item>
            <a-descriptions-item label="主色调">
              <a-space>
                {{ picture.picColor ?? '-' }}
                <div
                  v-if="picture.picColor"
                  :style="{
                    width: '16px',
                    height: '16px',
                    backgroundColor: toHexColor(picture.picColor),
                  }"
                />
              </a-space>
            </a-descriptions-item>
          </a-descriptions>
          <!-- 图片操作 -->
          <a-space wrap>
            <a-button type="primary" @click="doDownload">
              免费下载
              <template #icon>
                <DownloadOutlined />
              </template>
            </a-button>
            <a-button :icon="h(ShareAltOutlined)" type="primary" ghost @click="doShare">
              分享
            </a-button>
            <a-button v-if="canEdit" :icon="h(EditOutlined)" type="default" @click="doEdit">
              编辑
            </a-button>
            <a-button v-if="canDelete" :icon="h(DeleteOutlined)" danger @click="doDelete">
              删除
            </a-button>
          </a-space>
        </a-card>
      </a-col>
    </a-row>
    <ShareModal ref="shareModalRef" :link="shareLink" />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watchEffect } from 'vue'
import { deletePictureUsingPost, getPictureVoByIdUsingGet } from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ShareAltOutlined,
} from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { downloadImage, formatSize, toHexColor } from '@/utils'
import ShareModal from '@/components/ShareModal.vue'
import { SPACE_PERMISSION_ENUM } from '@/constants/space.ts'
import { getLoginUserUsingGet, getPermissionsUsingPost } from '@/api/userController.ts'

interface Props {
  id: string | number
}

const props = defineProps<Props>()
const picture = ref<API.PictureVO>({})

// 登录用户信息
const loginUser = ref<API.LoginUserVO>()
// 权限列表
const permissionList = ref<string[]>([])

// 获取登录用户信息
async function fetchLoginUser() {
  const res = await getLoginUserUsingGet()
  if (res.data.code === 0 && res.data.data) {
    loginUser.value = res.data.data
  }
}

// 获取权限列表
const fetchPermissions = async () => {
  if (!loginUser.value?.id || !picture.value.spaceId) return

  try {
    const res = await getPermissionsUsingPost({
      spaceId: undefined,
      userId: loginUser.value.id,
      pictureId: props.id
    })
    if (res.data.code === 0 && res.data.data) {
      permissionList.value = res.data.data
    }
  } catch (e) {
    console.error('获取权限失败:', e)
  }
}


/**
 * 重写编辑权限校验逻辑
 * 1. 获取 picture 对象的 spaceId 和 spaceType
 * 2. spaceId == null 校验是否为图片拥有者即是否有编辑权限 SPACE_PERMISSION_ENUM.PUBLIC_MODIFY_IMAGE
 *    否则进入 3
 * 3. spaceId != null
 * 3.1 spaceType == 0 私人空间 校验是有私人空间编辑权限
 * 3.2 spaceType == 1 团队空间 校验是否有团队空间编辑权限
 *
 * 重写删除权限校验逻辑和编辑权限保持一致，但是校验的权限不同。
 */
/**
 * 计算编辑权限
 */
const canEdit = computed(() => {
  if (!picture.value) return false
  if (!picture.value.spaceId) {
    return permissionList.value.includes(SPACE_PERMISSION_ENUM.PUBLIC_MODIFY_IMAGE)
  }
  if (picture.value.spaceType === 0) {
    return permissionList.value.includes(SPACE_PERMISSION_ENUM.PRIVATE_MODIFY_IMAGE)
  }
  return permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_MODIFY_IMAGE)
})

/**
 * 计算删除权限
 */
const canDelete = computed(() => {
  if (!picture.value) return false
  if (!picture.value.spaceId) {
    return permissionList.value.includes(SPACE_PERMISSION_ENUM.PUBLIC_DELETE_IMAGE)
  }
  if (picture.value.spaceType === 0) {
    return permissionList.value.includes(SPACE_PERMISSION_ENUM.PRIVATE_DELETE_IMAGE)
  }
  return permissionList.value.includes(SPACE_PERMISSION_ENUM.TEAM_DELETE_IMAGE)
})

// 获取图片详情
const fetchPictureDetail = async () => {
  try {
    const res = await getPictureVoByIdUsingGet({
      id: props.id,
    })
    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
    } else {
      message.error('获取图片详情失败，' + res.data.message)
    }
  } catch (e: any) {
    message.error('获取图片详情失败：' + e.message)
  }
}

onMounted(async () => {
  await fetchLoginUser()
  await fetchPictureDetail()
})

watchEffect(() => {
  if (loginUser.value && picture.value.spaceId !== undefined) {
    fetchPermissions()
  }
})

const router = useRouter()

// 编辑
const doEdit = () => {
  router.push({
    path: '/add_picture',
    query: {
      id: picture.value.id,
      spaceId: picture.value.spaceId,
    },
  })
}

// 删除数据
const doDelete = async () => {
  const id = picture.value.id
  if (!id) {
    return
  }
  const res = await deletePictureUsingPost({ id })
  if (res.data.code === 0) {
    message.success('删除成功')
  } else {
    message.error('删除失败')
  }
}

// 下载图片
const doDownload = () => {
  downloadImage(picture.value.url)
}

// ----- 分享操作 ----
const shareModalRef = ref()
// 分享链接
const shareLink = ref<string>()
// 分享
const doShare = () => {
  shareLink.value = `${window.location.protocol}//${window.location.host}/picture/${picture.value.id}`
  if (shareModalRef.value) {
    shareModalRef.value.openModal()
  }
}
</script>

<style scoped>
#pictureDetailPage {
  margin-bottom: 16px;
}
</style>
