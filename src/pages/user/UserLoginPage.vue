<template>
  <div id="userLoginPage" class="app-auth-shell">
    <section class="app-auth-panel">
      <span class="auth-eyebrow">Cloud AI Workspace</span>
      <h1 class="auth-title">登录云端超分平台，继续你的任务与结果流。</h1>
      <p class="auth-desc">
        在同一个入口里处理图片增强、视频超分、案例浏览和团队协作。后端服务与权限逻辑保持不变，前端体验升级为更轻量的工作台结构。
      </p>
      <div class="auth-points">
        <div class="auth-point">统一任务入口</div>
        <div class="auth-point">图片与视频超分</div>
        <div class="auth-point">团队协作与结果沉淀</div>
      </div>
    </section>

    <section class="app-auth-form">
      <div class="form-head">
        <h2 class="form-title">欢迎回来</h2>
        <p class="form-desc">输入账号与密码，回到你的人工作空间。</p>
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
import router from '@/router'
import { userLoginUsingPost } from '@/api/userController.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { useWebSocketStore } from '@/stores/useWebSocketStore.ts'

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
}

.auth-eyebrow {
  color: @accent-color;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.auth-title {
  margin: 18px 0 0;
  max-width: 560px;
  font-size: 42px;
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
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.auth-point {
  padding: 10px 14px;
  border: 1px solid @border-color;
  border-radius: @border-radius-pill;
  background: rgba(255, 255, 255, 0.7);
}

.form-head {
  margin-bottom: 24px;
}

.form-title {
  margin: 0;
  font-size: 28px;
}

.form-desc {
  margin: 8px 0 0;
  color: @text-secondary;
}

.form-link-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
  color: @text-secondary;
  font-size: 14px;
}
</style>
