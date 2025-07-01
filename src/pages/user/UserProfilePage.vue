<template>
  <div id="userProfilePage" class="page-container">
    <div class="profile-container">
      <!-- 上部分：用户信息 -->
      <div class="user-info-section">
        <!-- 左：头像 -->
        <div class="avatar-wrapper">
          <a-upload
            name="avatar"
            class="avatar-uploader"
            :show-upload-list="false"
            :custom-request="handleAvatarUpload"
            :before-upload="beforeAvatarUpload"
          >
            <a-avatar :src="user?.userAvatar" class="big-avatar" />
            <div class="upload-overlay">
              <CameraOutlined class="upload-icon" />
            </div>
          </a-upload>
        </div>
        <!-- 右：个人信息 -->
        <div class="info-wrapper">
          <div class="user-name">{{ user?.userName || '未登录' }}</div>
          <div class="user-id">ID：{{ user?.id || '-' }}</div>
          <div class="user-profile">
            <span class="label">简介：</span>{{ user?.userProfile || '暂无简介' }}
          </div>
          <div class="edit-button-wrapper">
            <a-space>
              <a-button type="primary" @click="showEditModal = true">
                <EditOutlined /> 修改信息
              </a-button>
              <a-badge :count="unreadCount" :offset="[10, 0]">
                <a-button @click="showMessageModal = true">
                  <BellOutlined /> 收件箱
                </a-button>
              </a-badge>
            </a-space>
          </div>
        </div>
      </div>

      <!-- 下部分：发布的图片列表（仅展示前几张） -->
      <div class="user-pictures-section">
        <template v-if="user">
          <div class="pictures-header">
            <span class="pictures-title">发布的图片</span>
          </div>
          <div class="preview-picture-wrapper">
            <div v-if="previewPictures.length > 0" class="preview-picture-list">
              <a-card
                v-for="(picture, index) in previewPictures"
                :key="picture.id"
                hoverable
                class="preview-card"
                @click="goToPicture(picture.id)"
              >
                <template #cover>
                  <img :src="picture.thumbnailUrl || picture.url" :alt="picture.name" style="height: 120px; object-fit: cover" />
                </template>
                <a-card-meta :title="picture.name" />
              </a-card>
              <div class="view-more-gradient" @click="showPictureModal = true">
                <div class="view-more-text">查看更多</div>
              </div>
            </div>
            <div v-else>
              <a-empty description="暂无图片" />
            </div>
          </div>
        </template>
        <a-spin v-else />
      </div>
    </div>

    <!-- 修改信息弹窗 -->
    <a-modal
      v-model:open="showEditModal"
      title="修改个人信息"
      @ok="handleUpdateUserInfo"
      @cancel="showEditModal = false"
      :confirm-loading="updateLoading"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="用户名" name="userName">
          <a-input v-model:value="editForm.userName" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="个人简介" name="userProfile">
          <a-textarea v-model:value="editForm.userProfile" placeholder="请输入个人简介" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 图片瀑布流弹窗 -->
    <a-modal
      v-model:open="showPictureModal"
      title="我的所有图片"
      width="80%"
      :footer="null"
      @afterOpen="handleModalOpened"
      @cancel="showPictureModal = false"
    >
      <a-spin :spinning="isPictureListLoading">
        <PictureList
          v-if="showPictureModal && user?.id"
          ref="pictureListRef"
          :query="{ userId: user.id, sortField: 'createTime', sortOrder: 'desc' }"
          :autoFetch="true"
          :infinite="true"
          :useObserver="true"
          @loading-change="handlePictureLoadingChange"
        />
      </a-spin>
    </a-modal>

    <!-- 消息列表弹窗 -->
    <a-modal
      v-model:open="showMessageModal"
      title="未读消息"
      @ok="showMessageModal = false"
      @cancel="showMessageModal = false"
      :footer="null"
      width="600px"
    >
      <a-list
        :data-source="unreadMessages"
        :loading="messageLoading"
        item-layout="horizontal"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <div class="message-list-item-wrapper">
              <a-list-item-meta>
                <template #title>
                  <div class="message-content-wrapper">
                    <a @click="openMessageDetail(item)">{{ item.content }}</a>
                  </div>
                </template>
                <template #description>
                  {{ item.createAt }}
                </template>
              </a-list-item-meta>
            </div>
          </a-list-item>
        </template>
        <template #empty>
          <div style="text-align: center; padding: 20px;">
            暂无未读消息
          </div>
        </template>
      </a-list>
    </a-modal>

    <!-- 消息详情弹窗 -->
    <a-modal
      v-model:open="showDetailModal"
      title="消息详情"
      @ok="currentMessage && handleReadMessage(currentMessage)"
      @cancel="showDetailModal = false"
      okText="标记已读"
      cancelText="关闭"
      :okButtonProps="{ disabled: !currentMessage }"
    >
      <div class="message-detail">
        <div class="message-detail-content">{{ currentMessage?.content }}</div>
        <div class="message-detail-time">{{ currentMessage?.createAt }}</div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { updateUserInfoUsingPost } from '@/api/userController.ts'
import {
  listMyPictureVoByPageUsingPost,
  uploadUserAvatarPictureUsingPost,
} from '@/api/pictureController.ts'
import {
  getUnreadMessageNumUsingGet,
  getUnreadMessageListUsingGet,
  setReviewStatusUsingPost,
} from '@/api/messageController.ts'
import PictureList from '@/components/PictureList.vue'
import { EditOutlined, CameraOutlined, BellOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { useRouter } from 'vue-router'
import { ref, onMounted, watch, nextTick } from 'vue'

const user = ref<API.LoginUserVO | null>(null)
const pictureList = ref<API.PictureVO[]>([])
const previewPictures = ref<API.PictureVO[]>([])
const loading = ref(false)
const showEditModal = ref(false)
const showPictureModal = ref(false)
const updateLoading = ref(false)
const editForm = ref<API.UserUpdateRequest>({
  userName: '',
  userProfile: '',
})
const loginUserStore = useLoginUserStore()
const router = useRouter()
const isPictureListLoading = ref(false) // 图片列表加载状态
const pictureListRef = ref() // 添加对PictureList组件的引用
const showMessageModal = ref(false)
const unreadCount = ref(0)
const unreadMessages = ref<API.ReviewMessage[]>([])
const messageLoading = ref(false)
const showDetailModal = ref(false)
const currentMessage = ref<API.ReviewMessage | null>(null)

// 处理图片列表加载状态变化
const handlePictureLoadingChange = (isLoading: boolean) => {
  isPictureListLoading.value = isLoading
}

// 弹窗完全打开后重置Observer
const handleModalOpened = () => {
  nextTick(() => {
    if (pictureListRef.value && pictureListRef.value.resetObserver) {
      pictureListRef.value.resetObserver()
    }
  })
}

const beforeAvatarUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJpgOrPng) {
    message.error('只能上传 JPG/PNG 格式的图片!')
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB!')
  }
  return isJpgOrPng && isLt2M
}

const handleAvatarUpload = async (options: any) => {
  const { file } = options
  try {
    const res = await uploadUserAvatarPictureUsingPost(file)
    if (res.data.code === 0) {
      message.success('头像上传成功')
      await loginUserStore.fetchLoginUser()
      user.value = { ...loginUserStore.loginUser }
    } else {
      message.error('头像上传失败：' + (res.data as any).message)
    }
  } catch (error) {
    message.error('头像上传失败')
  }
}

const fetchPictures = async () => {
  if (!user.value?.id) return
  loading.value = true
  const res = await listMyPictureVoByPageUsingPost({
    userId: user.value.id,
    current: 1,
    pageSize: 20,
    sortField: 'createTime',
    sortOrder: 'desc',
  })
  loading.value = false
  if (res.data.code === 0 && res.data.data) {
    pictureList.value = res.data.data.records || []
    previewPictures.value = pictureList.value.slice(0, 5)
  }
}

const goToPicture = (id: number) => {
  router.push(`/picture/${id}`)
}

const handleUpdateUserInfo = async () => {
  if (!editForm.value.userName?.trim()) {
    message.error('用户名不能为空')
    return
  }
  updateLoading.value = true
  try {
    const res = await updateUserInfoUsingPost(editForm.value)
    if (res.data.code === 0) {
      message.success('更新成功')
      showEditModal.value = false
      await loginUserStore.fetchLoginUser()
      user.value = { ...loginUserStore.loginUser }
    } else {
      message.error('更新失败：' + res.data.message)
    }
  } catch (error) {
    message.error('更新失败')
  } finally {
    updateLoading.value = false
  }
}

const openEditModal = () => {
  if (user.value) {
    editForm.value = {
      id: user.value.id,
      userName: user.value.userName || '',
      userProfile: user.value.userProfile || '',
    }
  }
  showEditModal.value = true
}

// 获取未读消息数量
const fetchUnreadMessageCount = async () => {
  try {
    const res = await getUnreadMessageNumUsingGet()
    if (res.data.code === 0) {
      unreadCount.value = res.data.data || 0
    }
  } catch (error) {
    console.error('获取未读消息数量失败:', error)
  }
}

// 获取未读消息列表
const fetchUnreadMessages = async () => {
  messageLoading.value = true
  try {
    const res = await getUnreadMessageListUsingGet()
    if (res.data.code === 0) {
      unreadMessages.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取未读消息列表失败:', error)
  } finally {
    messageLoading.value = false
  }
}

// 标记消息为已读
const handleReadMessage = async (item: API.ReviewMessage) => {
  if (!user.value?.id || !item.id) return

  try {
    const res = await setReviewStatusUsingPost({
      userId: user.value.id,
      msgId: item.id
    })
    if (res.data?.code === 0) {
      message.success('已标记为已读')
      // 更新未读消息数量和列表
      await fetchUnreadMessageCount()
      await fetchUnreadMessages()
    }
  } catch (error) {
    message.error('操作失败')
  }
}

// 监听消息弹窗打开，获取最新未读消息列表
watch(showMessageModal, (newVal) => {
  if (newVal) {
    fetchUnreadMessages()
  }
})

// 打开消息详情
const openMessageDetail = (message: API.ReviewMessage) => {
  currentMessage.value = message
  showDetailModal.value = true
}

onMounted(async () => {
  await loginUserStore.fetchLoginUser()
  if (loginUserStore.loginUser.id) {
    user.value = { ...loginUserStore.loginUser }
    fetchPictures()
    // 获取未读消息数量
    fetchUnreadMessageCount()
  }
})

watch(showEditModal, (newVal) => {
  if (newVal) openEditModal()
})

watch(pictureList, (newList) => {
  previewPictures.value = newList.slice(0, 10)
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}
.profile-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.user-info-section {
  display: flex;
  align-items: center;
  gap: 32px;
}
.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
}
.big-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}
.avatar-uploader {
  width: 100%;
  height: 100%;
  display: inline-block;
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
}
.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s;
}
.avatar-uploader:hover .upload-overlay {
  opacity: 1;
}
.upload-icon {
  font-size: 24px;
}
.info-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 500px;
}
.user-name {
  font-size: 20px;
  font-weight: bold;
}
.user-id {
  color: #666;
}
.user-profile {
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
}
.label {
  font-weight: 500;
}
.edit-button-wrapper {
  margin-top: 16px;
}
.user-pictures-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.pictures-header {
  font-size: 18px;
  font-weight: bold;
}
.preview-picture-wrapper {
  position: relative;
}
.preview-picture-list {
  display: flex;
  gap: 16px;
  flex-wrap: nowrap;
  overflow: hidden;
  position: relative;
  padding-right: 80px;
}
.preview-card {
  width: 160px;
  flex-shrink: 0;
}
.view-more-gradient {
  position: absolute;
  top: 0;
  right: 0;
  width: 120px;
  height: 100%;
  background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.8), #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
}
.view-more-text {
  color: #1890ff;
  font-weight: 500;
}

/* 修改后的消息列表样式 */
.message-list-item-wrapper {
  position: relative;
  width: 100%;
  padding-right: 24px;
}

.message-content-wrapper {
  display: flex;
  max-width: 100%;
}

.message-content-wrapper a {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(0, 0, 0, 0.85);
  cursor: pointer;
  transition: color 0.3s;
}

.message-content-wrapper a:hover {
  color: #1890ff;
}

/* 移除之前多余的渐变遮罩样式 */

:deep(.ant-list-item-meta-title) {
  margin-bottom: 4px !important;
  width: 100%;
}

:deep(.ant-list-item-meta-description) {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}

.message-detail {
  padding: 16px;
  background: #fff;
}

.message-detail-content {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.85);
  white-space: pre-wrap;
  word-break: break-word;
}

.message-detail-time {
  margin-top: 16px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  text-align: right;
}

/* 弹窗样式调整 */
:deep(.ant-modal-body) {
  padding: 24px;
  background: #fff;
  max-height: 60vh;
  overflow-y: auto;
}

:deep(.ant-list-item) {
  padding: 12px 24px;
  transition: background-color 0.3s;
}

:deep(.ant-list-item:hover) {
  background-color: #fafafa;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .user-info-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .preview-picture-list {
    flex-wrap: wrap;
    padding-right: 0;
  }

  .view-more-gradient {
    position: static;
    width: auto;
    height: auto;
    background: none;
    margin-top: 16px;
  }
}
</style>
