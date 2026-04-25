<template>
  <header v-if="!isAuthShell" id="globalHeader">
    <div class="header-copy">
      <p class="header-scene">{{ sceneLabel }}</p>
      <h1 class="header-title">{{ pageTitle }}</h1>
      <p class="header-subtitle">{{ pageSubtitle }}</p>
    </div>
    <div class="header-actions">
      <a-space v-if="loginUserStore.loginUser.id" wrap>
        <a-dropdown>
          <div class="profile-pill">
            <a-avatar :src="loginUserStore.loginUser.userAvatar">
              {{ loginUserInitial }}
            </a-avatar>
            <div class="profile-text">
              <span class="profile-name">{{ loginUserStore.loginUser.userName || '游客' }}</span>
              <span class="profile-role">{{ roleLabel }}</span>
            </div>
          </div>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="router.push('/user/profile')">账户中心</a-menu-item>
              <a-menu-item @click="router.push('/user_exchange_vip')">容量与规格升级</a-menu-item>
              <a-menu-item @click="doLogout">退出登录</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </a-space>
      <a-space v-else>
        <a-button @click="router.push('/user/register')">注册</a-button>
        <a-button type="primary" @click="router.push('/user/login')">登录</a-button>
      </a-space>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { userLogoutUsingPost } from '@/api/userController.ts'
import { SCENE_LABEL_MAP } from '@/constants/app.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { useWebSocketStore } from '@/stores/useWebSocketStore.ts'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()
const webSocketStore = useWebSocketStore()

const isAuthShell = computed(() => route.meta?.shell === 'auth')
const pageTitle = computed(() => String(route.meta?.title || '云端超分'))
const pageSubtitle = computed(() =>
  String(route.meta?.subtitle || '统一处理上传、修复、结果查看和团队协作。'),
)
const sceneLabel = computed(() => {
  const key = route.meta?.scene as keyof typeof SCENE_LABEL_MAP | undefined
  return key ? SCENE_LABEL_MAP[key] : '超分工作台'
})
const loginUserInitial = computed(() => String(loginUserStore.loginUser.userName || '修').slice(0, 1))
const roleLabel = computed(() =>
  loginUserStore.loginUser.userRole === 'admin' ? '平台管理员' : '工作台成员',
)

const doLogout = async () => {
  const res = await userLogoutUsingPost()
  if (res.data.code === 0) {
    webSocketStore.disconnect()
    loginUserStore.setLoginUser({
      userName: '游客',
    })
    message.success('已退出登录')
    await router.push('/user/login')
    return
  }
  message.error('退出失败，' + res.data.message)
}
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

#globalHeader {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  padding: 16px 20px;
  border: 1px solid @border-color;
  border-radius: @border-radius-lg;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: @shadow-sm;
  backdrop-filter: blur(12px);
}

.header-copy {
  min-width: 0;
}

.header-scene {
  margin: 0 0 8px;
  color: @text-secondary;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.header-title {
  margin: 0;
  font-size: 24px;
  line-height: 1.12;
  letter-spacing: -0.025em;
}

.header-subtitle {
  margin: 10px 0 0;
  color: @text-secondary;
  font-size: 14px;
  line-height: 1.7;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
}

.profile-pill {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 204px;
  padding: 9px 13px;
  border: 1px solid @border-color;
  border-radius: @border-radius-pill;
  background: #fff;
  cursor: pointer;
  transition: 0.2s ease;
}

.profile-pill:hover {
  border-color: @border-strong;
  box-shadow: @shadow-sm;
}

.profile-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.profile-name {
  font-size: 14px;
  font-weight: 600;
}

.profile-role {
  color: @text-secondary;
  font-size: 12px;
}

@media (max-width: 960px) {
  #globalHeader {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
