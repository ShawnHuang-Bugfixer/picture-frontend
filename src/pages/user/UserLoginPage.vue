<template>
  <div id="userLoginPage" class="app-auth-shell">
    <PhotoOrbitBackground :items="loginOrbitItems" />

    <section class="app-auth-panel">
      <span class="auth-eyebrow">Super Resolution Workspace</span>
      <h1 class="auth-title">回到你的超分工作台，继续处理待修复的图片和视频。</h1>
      <p class="auth-desc">
        在同一个入口里处理图片增强、视频超分、案例查看和团队协作。你登录后就能回到上一次的工作流，继续上传、处理和查看结果。
      </p>
      <div class="auth-points">
        <div class="auth-point">一个入口提交修复任务</div>
        <div class="auth-point">图片与视频都能增强</div>
        <div class="auth-point">结果和协作集中管理</div>
      </div>
    </section>

    <section class="app-auth-form">
      <div class="form-head">
        <h2 class="form-title">欢迎回来</h2>
        <p class="form-desc">输入账号和密码，回到你的个人工作台。</p>
      </div>
      <a-form :model="formState" name="loginForm" autocomplete="off" @finish="handleSubmit">
        <a-form-item name="userAccount" :rules="[{ required: true, message: '请输入账号' }]">
          <a-input v-model:value="formState.userAccount" placeholder="账号" />
        </a-form-item>
        <a-form-item
          name="userPassword"
          :rules="[
            { required: true, message: '请输入密码' },
            { min: 8, message: '密码长度不能小于 8 位' },
          ]"
        >
          <a-input-password v-model:value="formState.userPassword" placeholder="密码" />
        </a-form-item>
        <div class="form-link-row">
          <span>还没有账号？</span>
          <RouterLink to="/user/register">立即注册</RouterLink>
        </div>
        <a-form-item>
          <a-button type="primary" html-type="submit" style="width: 100%">登录</a-button>
        </a-form-item>
      </a-form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { message } from 'ant-design-vue'
import PhotoOrbitBackground from '@/components/PhotoOrbitBackground.vue'
import type { PhotoOrbitItem } from '@/components/PhotoOrbitBackground.vue'
import router from '@/router'
import { userLoginUsingPost } from '@/api/userController.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { useWebSocketStore } from '@/stores/useWebSocketStore.ts'

const loginOrbitItems: PhotoOrbitItem[] = [
  { title: 'Image Restore', meta: '2x / 4x SR', tone: 'blue' },
  { title: 'Video Upscale', meta: 'Frame detail', tone: 'cyan' },
  { title: 'Case Gallery', meta: 'Before / After', tone: 'slate' },
  { title: 'Batch Queue', meta: 'Workspace', tone: 'green' },
  { title: 'Noise Clean', meta: 'AI repair', tone: 'amber' },
  { title: 'Face Detail', meta: 'Texture boost', tone: 'rose' },
  { title: 'Team Review', meta: 'Shared result', tone: 'indigo' },
  { title: 'Smart Crop', meta: 'Composition', tone: 'violet' },
  { title: 'Result Export', meta: 'HD output', tone: 'teal' },
  { title: 'Model Preset', meta: 'Clean profile', tone: 'orange' },
]

const formState = reactive<API.UserLoginRequest>({
  userAccount: '',
  userPassword: '',
})

const loginUserStore = useLoginUserStore()
const webSocketStore = useWebSocketStore()

const handleSubmit = async (values: API.UserLoginRequest) => {
  const res = await userLoginUsingPost(values)
  if (res.data.code === 0 && res.data.data) {
    await loginUserStore.fetchLoginUser()
    webSocketStore.resetUnreadModalFlag()
    webSocketStore.initWebSocket()
    router.push({
      path: '/',
      replace: true,
    })
    return
  }
  message.error('登录失败，' + res.data.message)
}
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

#userLoginPage {
  align-items: center;
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

#userLoginPage .app-auth-panel,
#userLoginPage .app-auth-form {
  position: relative;
  z-index: 2;
}

#userLoginPage .app-auth-panel {
  background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.1), transparent 28%),
    radial-gradient(circle at bottom right, rgba(255, 255, 255, 0.56), transparent 24%),
    linear-gradient(145deg, rgba(255, 255, 255, 0.74) 0%, rgba(251, 251, 252, 0.82) 100%);
}

.auth-eyebrow {
  color: @text-secondary;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.auth-title {
  margin: 18px 0 0;
  max-width: 560px;
  font-size: 44px;
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.auth-desc {
  margin: 18px 0 0;
  max-width: 560px;
  color: @text-secondary;
  font-size: 15px;
  line-height: 1.8;
}

.auth-points {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 32px;
  max-width: 560px;
}

.auth-point {
  padding: 14px 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: @border-radius-md;
  background: rgba(255, 255, 255, 0.7);
  color: @text-color;
  backdrop-filter: blur(8px);
}

.form-head {
  margin-bottom: 28px;
}

.form-title {
  margin: 0;
  font-size: 30px;
  letter-spacing: -0.03em;
}

.form-desc {
  margin: 8px 0 0;
  color: @text-secondary;
  line-height: 1.7;
}

.form-link-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
  color: @text-secondary;
  font-size: 14px;
}

:deep(.ant-form-item) {
  margin-bottom: 18px;
}

:deep(.ant-input),
:deep(.ant-input-password) {
  background: rgba(255, 255, 255, 0.88);
}

:deep(.ant-btn-primary) {
  height: 48px;
  font-size: 15px;
  font-weight: 600;
}

@media (max-width: 960px) {
  .auth-title {
    font-size: 36px;
  }

  .auth-points {
    grid-template-columns: 1fr;
  }
}
</style>
