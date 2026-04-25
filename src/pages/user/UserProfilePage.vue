<template>
  <div id="userProfilePage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">账户中心</h2>
        <p class="app-page__subtitle">查看账户资料、消息提醒、我的样例和近期处理记录。</p>
      </div>
    </section>

    <section class="profile-shell">
      <div class="profile-summary app-card">
        <div class="profile-summary__main">
          <a-upload
            name="avatar"
            class="avatar-uploader"
            :show-upload-list="false"
            :custom-request="handleAvatarUpload"
            :before-upload="beforeAvatarUpload"
          >
            <div class="avatar-wrap">
              <a-avatar :src="user?.userAvatar" :size="112" class="profile-avatar" />
              <div class="avatar-mask">
                <CameraOutlined />
                <span>更新头像</span>
              </div>
            </div>
          </a-upload>

          <div class="profile-meta">
            <div class="profile-name">{{ user?.userName || '游客' }}</div>
            <div class="profile-id">账号 ID：{{ user?.id || '-' }}</div>
            <div class="profile-desc">{{ user?.userProfile || '暂未填写个人简介。' }}</div>
          </div>
        </div>

        <div class="profile-actions">
          <a-button type="primary" @click="openEditModal">
            <EditOutlined />
            编辑资料
          </a-button>
          <a-button @click="showAppealingPictureModal = true">处理中申诉</a-button>
          <a-badge :count="unreadCount" :offset="[8, 0]">
            <a-button @click="showMessageModal = true">
              <BellOutlined />
              消息中心
            </a-button>
          </a-badge>
        </div>
      </div>

      <div class="content-grid">
        <section class="app-card">
          <div class="section-head">
            <div>
              <h3 class="app-section-title">我的素材</h3>
              <p class="app-section-desc">最近上传或整理过的图片、视频和案例。</p>
            </div>
            <a-button type="link" @click="showPictureModal = true">查看全部</a-button>
          </div>
          <div v-if="previewPictures.length" class="preview-grid">
            <a-card
              v-for="picture in previewPictures"
              :key="picture.id"
              hoverable
              class="preview-card"
              @click="goToPicture(picture.id!)"
            >
              <template #cover>
                <img
                  :src="picture.thumbnailUrl || picture.url"
                  :alt="picture.name"
                  class="preview-card__image"
                />
              </template>
              <a-card-meta :title="picture.name || '未命名素材'" />
            </a-card>
          </div>
          <a-empty v-else description="暂无素材" />
        </section>

        <section class="app-card">
          <div class="section-head">
            <div>
              <h3 class="app-section-title">待处理反馈</h3>
              <p class="app-section-desc">这里会列出暂未通过的内容，方便你继续补充说明。</p>
            </div>
            <a-button type="link" @click="showRejectedPictureModal = true">查看全部</a-button>
          </div>
          <div v-if="previewRejectedPictures.length" class="preview-grid">
            <a-card
              v-for="picture in previewRejectedPictures"
              :key="picture.id"
              hoverable
              class="preview-card"
              @click="goToPicture(picture.id!)"
            >
              <template #cover>
                <img
                  :src="picture.thumbnailUrl || picture.url"
                  :alt="picture.name"
                  class="preview-card__image"
                />
              </template>
              <a-card-meta :title="picture.name || '未命名素材'" />
            </a-card>
          </div>
          <a-empty v-else description="暂无待处理反馈" />
        </section>
      </div>
    </section>

    <a-modal
      v-model:open="showEditModal"
      title="编辑个人资料"
      @ok="handleUpdateUserInfo"
      @cancel="showEditModal = false"
      :confirm-loading="updateLoading"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="用户名" name="userName">
          <a-input v-model:value="editForm.userName" placeholder="输入用户名" />
        </a-form-item>
        <a-form-item label="个人简介" name="userProfile">
          <a-textarea v-model:value="editForm.userProfile" placeholder="输入个人简介" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="showPictureModal"
      title="我的全部素材"
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
          :fetchFunc="listMyPictureVoByPageUsingPost"
          :showOp="true"
          :canEdit="true"
          :canDelete="true"
          :onReload="handlePictureListReload"
          @loading-change="handlePictureLoadingChange"
        />
      </a-spin>
    </a-modal>

    <a-modal
      v-model:open="showRejectedPictureModal"
      title="待处理反馈"
      width="80%"
      :footer="null"
      @afterOpen="handleRejectedModalOpened"
      @cancel="showRejectedPictureModal = false"
    >
      <a-spin :spinning="isRejectedPictureListLoading">
        <PictureList
          v-if="showRejectedPictureModal && user?.id"
          ref="rejectedPictureListRef"
          :query="{
            userId: user.id,
            reviewStatus: PIC_REVIEW_STATUS_ENUM.FINAL_REJECTED,
            sortField: 'createTime',
            sortOrder: 'desc',
          }"
          :autoFetch="true"
          :infinite="true"
          :useObserver="true"
          :fetchFunc="listMyPictureVoByPageUsingPost"
          :showOp="true"
          :canEdit="true"
          :canDelete="true"
          :onReload="handleRejectedPictureListReload"
          :showShare="false"
          :showSearch="false"
          :showId="true"
          :onAppeal="handleAppealFromCard"
          @loading-change="handleRejectedPictureLoadingChange"
        />
      </a-spin>
    </a-modal>

    <a-modal
      v-model:open="showMessageModal"
      title="未读消息"
      :footer="null"
      width="600px"
      @cancel="showMessageModal = false"
    >
      <a-list :data-source="unreadMessages" :loading="messageLoading" item-layout="horizontal">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta>
              <template #title>
                <a @click="openMessageDetail(item)">{{ item.content }}</a>
              </template>
              <template #description>
                {{ item.createAt }}
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
        <template #empty>
          <div class="empty-message">暂无未读消息</div>
        </template>
      </a-list>
    </a-modal>

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
        <div class="message-detail__content">{{ currentMessage?.content }}</div>
        <div class="message-detail__time">{{ currentMessage?.createAt }}</div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="showAppealModal"
      title="补充说明"
      @ok="handleAppeal"
      @cancel="showAppealModal = false"
      :confirm-loading="appealLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="素材 ID" name="pictureId">
          <a-input :value="appealForm.pictureId ? String(appealForm.pictureId) : ''" readonly />
        </a-form-item>
        <a-form-item label="补充说明" name="reason">
          <a-textarea
            v-model:value="appealForm.reason"
            placeholder="输入补充说明"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="showAppealingPictureModal"
      title="处理中申诉"
      width="80%"
      :footer="null"
      @cancel="showAppealingPictureModal = false"
    >
      <a-spin :spinning="isPictureListLoading">
        <PictureList
          v-if="showAppealingPictureModal && user?.id"
          :query="{
            userId: user.id,
            reviewStatus: Number(PIC_REVIEW_STATUS_ENUM.APPEAL_PENDING),
            sortField: 'createTime',
            sortOrder: 'desc',
          }"
          :autoFetch="true"
          :infinite="true"
          :useObserver="true"
          :fetchFunc="listMyPictureVoByPageUsingPost"
          :showOp="false"
          :showShare="false"
          :showSearch="false"
          :canEdit="false"
          :canDelete="false"
          @loading-change="handlePictureLoadingChange"
        />
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { BellOutlined, CameraOutlined, EditOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  appealRejectedPictureUsingPost,
  listMyPictureVoByPageUsingPost,
  uploadUserAvatarPictureUsingPost,
} from '@/api/pictureController.ts'
import {
  getUnreadMessageListUsingGet,
  getUnreadMessageNumUsingGet,
  setReviewStatusUsingPost,
} from '@/api/messageController.ts'
import { updateUserInfoUsingPost } from '@/api/userController.ts'
import PictureList from '@/components/PictureList.vue'
import { PIC_REVIEW_STATUS_ENUM } from '@/constants/picture.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

const loginUserStore = useLoginUserStore()
const router = useRouter()

const user = ref<API.LoginUserVO | null>(null)
const pictureList = ref<API.PictureVO[]>([])
const previewPictures = ref<API.PictureVO[]>([])
const rejectedPictureList = ref<API.PictureVO[]>([])
const previewRejectedPictures = ref<API.PictureVO[]>([])
const loading = ref(false)

const showEditModal = ref(false)
const showPictureModal = ref(false)
const showRejectedPictureModal = ref(false)
const showMessageModal = ref(false)
const showDetailModal = ref(false)
const showAppealModal = ref(false)
const showAppealingPictureModal = ref(false)

const updateLoading = ref(false)
const isPictureListLoading = ref(false)
const isRejectedPictureListLoading = ref(false)
const messageLoading = ref(false)
const appealLoading = ref(false)

const pictureListRef = ref()
const rejectedPictureListRef = ref()

const unreadCount = ref(0)
const unreadMessages = ref<API.ReviewMessage[]>([])
const currentMessage = ref<API.ReviewMessage | null>(null)

const editForm = ref<API.UserUpdateRequest>({
  userName: '',
  userProfile: '',
})

const appealForm = ref<{
  pictureId?: number
  reason: string
}>({
  pictureId: undefined,
  reason: '',
})

const handlePictureLoadingChange = (isLoading: boolean) => {
  isPictureListLoading.value = isLoading
}

const handleRejectedPictureLoadingChange = (isLoading: boolean) => {
  isRejectedPictureListLoading.value = isLoading
}

const handleModalOpened = () => {
  nextTick(() => {
    pictureListRef.value?.resetObserver?.()
  })
}

const handleRejectedModalOpened = () => {
  nextTick(() => {
    rejectedPictureListRef.value?.resetObserver?.()
  })
}

const beforeAvatarUpload = (file: File) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
  if (!isJpgOrPng) {
    message.error('仅支持上传 JPG/PNG 格式头像')
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('头像大小不能超过 2MB')
  }
  return isJpgOrPng && isLt2M
}

const handleAvatarUpload = async (options: any) => {
  const { file } = options
  try {
    const res = await uploadUserAvatarPictureUsingPost(file)
    if ((res.data as any).code === 0) {
      message.success('头像上传成功')
      await loginUserStore.fetchLoginUser()
      user.value = { ...loginUserStore.loginUser }
    } else {
      message.error('头像上传失败，' + (res.data as any).message)
    }
  } catch {
    message.error('头像上传失败')
  }
}

const fetchPictures = async () => {
  if (!user.value?.id) {
    return
  }
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
    previewPictures.value = pictureList.value.slice(0, 6)
  }
}

const fetchRejectedPictures = async () => {
  if (!user.value?.id) {
    return
  }
  loading.value = true
  const res = await listMyPictureVoByPageUsingPost({
    userId: user.value.id,
    reviewStatus: PIC_REVIEW_STATUS_ENUM.FINAL_REJECTED,
    current: 1,
    pageSize: 20,
    sortField: 'createTime',
    sortOrder: 'desc',
  })
  loading.value = false
  if (res.data.code === 0 && res.data.data) {
    rejectedPictureList.value = res.data.data.records || []
    previewRejectedPictures.value = rejectedPictureList.value.slice(0, 6)
  }
}

const goToPicture = (id: number) => {
  router.push(`/picture/${id}`)
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

const handleUpdateUserInfo = async () => {
  if (!editForm.value.userName?.trim()) {
    message.error('用户名不能为空')
    return
  }
  updateLoading.value = true
  try {
    const res = await updateUserInfoUsingPost(editForm.value)
    if (res.data.code === 0) {
      message.success('资料更新成功')
      showEditModal.value = false
      await loginUserStore.fetchLoginUser()
      user.value = { ...loginUserStore.loginUser }
    } else {
      message.error('资料更新失败，' + res.data.message)
    }
  } catch {
    message.error('资料更新失败')
  } finally {
    updateLoading.value = false
  }
}

const handlePictureListReload = async () => {
  await fetchPictures()
}

const handleRejectedPictureListReload = async () => {
  await fetchRejectedPictures()
}

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

const handleReadMessage = async (item: API.ReviewMessage) => {
  if (!user.value?.id || !item.id) {
    return
  }
  try {
    const res = await setReviewStatusUsingPost({
      userId: user.value.id,
      msgId: item.id,
    })
    if (res.data?.code === 0) {
      message.success('已标记为已读')
      await fetchUnreadMessageCount()
      await fetchUnreadMessages()
      showDetailModal.value = false
    }
  } catch {
    message.error('操作失败')
  }
}

const openMessageDetail = (reviewMessage: API.ReviewMessage) => {
  currentMessage.value = reviewMessage
  showDetailModal.value = true
}

const handleAppeal = async () => {
  if (!appealForm.value.pictureId) {
    message.error('素材 ID 不能为空')
    return
  }
  appealLoading.value = true
  try {
    const res = await appealRejectedPictureUsingPost({
      picId: appealForm.value.pictureId,
    })
    if (res.data.code === 0) {
      message.success('说明已提交')
      showAppealModal.value = false
      appealForm.value = { pictureId: undefined, reason: '' }
      await fetchRejectedPictures()
    } else {
      message.error('提交失败，' + res.data.message)
    }
  } catch {
    message.error('提交失败')
  } finally {
    appealLoading.value = false
  }
}

const handleAppealFromCard = (picture: API.PictureVO) => {
  appealForm.value.pictureId = picture.id
  showAppealModal.value = true
}

onMounted(async () => {
  await loginUserStore.fetchLoginUser()
  if (loginUserStore.loginUser.id) {
    user.value = { ...loginUserStore.loginUser }
    fetchPictures()
    fetchRejectedPictures()
    fetchUnreadMessageCount()
  }
})

watch(showMessageModal, (open) => {
  if (open) {
    fetchUnreadMessages()
  }
})

watch(pictureList, (newList) => {
  previewPictures.value = newList.slice(0, 6)
})

watch(rejectedPictureList, (newList) => {
  previewRejectedPictures.value = newList.slice(0, 6)
})
</script>

<style scoped lang="less">
.profile-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
}

.profile-summary__main {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-uploader {
  display: inline-block;
}

.avatar-wrap {
  position: relative;
  width: 112px;
  height: 112px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
}

.profile-avatar {
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.14);
}

.avatar-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #fff;
  background: rgba(15, 23, 42, 0.45);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.avatar-wrap:hover .avatar-mask {
  opacity: 1;
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 560px;
}

.profile-name {
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.profile-id {
  color: #64748b;
}

.profile-desc {
  color: #334155;
  line-height: 1.7;
  white-space: pre-wrap;
}

.profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.content-grid > .app-card {
  padding: 24px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.preview-card {
  overflow: hidden;
  border-radius: 20px;
}

.preview-card__image {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.empty-message {
  padding: 20px 0;
  text-align: center;
  color: #64748b;
}

.message-detail {
  padding: 18px;
  border-radius: 20px;
  background: #f8fafc;
}

.message-detail__content {
  color: #0f172a;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-detail__time {
  margin-top: 16px;
  text-align: right;
  color: #64748b;
  font-size: 12px;
}

@media (max-width: 1080px) {
  .profile-summary {
    flex-direction: column;
    align-items: flex-start;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .profile-summary__main {
    flex-direction: column;
    align-items: flex-start;
  }

  .preview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
