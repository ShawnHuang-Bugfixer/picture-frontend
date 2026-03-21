<template>
  <div id="userRegisterPage" class="app-auth-shell">
    <section class="app-auth-panel">
      <span class="auth-eyebrow">Create Workspace</span>
      <h1 class="auth-title">注册账号，开始你的云端超分工作流。</h1>
      <p class="auth-desc">
        你可以创建人工作空间、发起图片和视频超分任务，并在团队协作空间中共享结果与案例沉淀。
      </p>
      <div class="auth-points">
        <div class="auth-point">邮箱验证</div>
        <div class="auth-point">滑块安全校验</div>
        <div class="auth-point">任务、结果、协作统一入口</div>
      </div>
    </section>

    <section class="app-auth-form">
      <div class="form-head">
        <h2 class="form-title">创建平台账号</h2>
        <p class="form-desc">注册后即可进入首页、工作空间和结果中心。</p>
      </div>
      <a-form :model="formState" name="registerForm" autocomplete="off" @finish="handleSubmit">
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
          <a-input-password v-model:value="formState.userPassword" placeholder="密码" autocomplete="new-password" />
        </a-form-item>
        <a-form-item
          name="checkPassword"
          :rules="[
            { required: true, message: '请输入确认密码' },
            { min: 8, message: '确认密码长度不能小于 8 位' },
            { validator: validateCheckPassword, trigger: 'blur' },
          ]"
        >
          <a-input-password v-model:value="formState.checkPassword" placeholder="确认密码" autocomplete="new-password" />
        </a-form-item>
        <a-form-item
          name="email"
          :rules="[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '邮箱格式不正确' },
          ]"
        >
          <div class="email-row">
            <a-input v-model:value="formState.email" placeholder="邮箱" />
            <a-button @click="handleSendCode" :disabled="codeBtnDisabled">{{ codeBtnText }}</a-button>
          </div>
        </a-form-item>
        <a-form-item name="code" :rules="[{ required: true, message: '请输入验证码' }]">
          <a-input v-model:value="formState.code" placeholder="邮箱验证码" />
        </a-form-item>
        <div class="form-link-row">
          <span>已有账号？</span>
          <RouterLink to="/user/login">返回登录</RouterLink>
        </div>
        <a-form-item>
          <a-button type="primary" html-type="submit" style="width: 100%">注册</a-button>
        </a-form-item>
      </a-form>
      <SliderCaptcha :visible="showSlider" @success="onSliderSuccess" @close="onSliderClose" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import router from '@/router'
import SliderCaptcha from '@/components/SliderCaptcha.vue'
import { userRegisterUsingPost } from '@/api/userController.ts'
import { sendEmailCode, getSliderToken } from '@/api/emailCodeController'

const formState = reactive<API.UserRegisterRequest>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
  email: '',
  code: '',
})

const codeBtnText = ref('获取验证码')
const codeBtnDisabled = ref(false)
let codeTimer: ReturnType<typeof setInterval> | null = null

const showSlider = ref(false)
let sliderResolve: ((value: boolean) => void) | null = null

const validateCheckPassword = (_rule: unknown, value: string) => {
  if (!value) {
    return Promise.reject('请输入确认密码')
  }
  if (value.length < 8) {
    return Promise.reject('确认密码长度不能小于 8 位')
  }
  if (value !== formState.userPassword) {
    return Promise.reject('两次输入的密码不一致')
  }
  return Promise.resolve()
}

const handleSubmit = async (values: API.UserRegisterRequest) => {
  if (!values.email) {
    message.error('请输入邮箱')
    return
  }
  if (!values.code) {
    message.error('请输入验证码')
    return
  }
  const res = await userRegisterUsingPost(values)
  if (res.data.code === 0 && res.data.data) {
    message.success('注册成功')
    router.push({
      path: '/user/login',
      replace: true,
    })
    return
  }
  message.error('注册失败，' + res.data.message)
}

const showSliderCaptcha = () => {
  showSlider.value = true
  return new Promise<boolean>((resolve) => {
    sliderResolve = resolve
  })
}

const onSliderSuccess = () => {
  showSlider.value = false
  sliderResolve?.(true)
}

const onSliderClose = () => {
  showSlider.value = false
  sliderResolve?.(false)
}

const handleSendCode = async () => {
  if (!formState.email) {
    message.error('请输入邮箱')
    return
  }

  const sliderResult = await showSliderCaptcha()
  if (!sliderResult) {
    message.error('请先通过滑块验证')
    return
  }

  const tokenRes = await getSliderToken()
  if (tokenRes.data.code !== 0 || !tokenRes.data.data) {
    message.error('获取滑块令牌失败')
    return
  }

  codeBtnDisabled.value = true
  codeBtnText.value = '发送中...'

  try {
    const res = await sendEmailCode(formState.email)
    if (res.data.code === 0 && res.data.data) {
      message.success('验证码已发送，请查收邮箱')
      let count = 60
      codeBtnText.value = `${count}s 后重试`
      codeTimer = setInterval(() => {
        count -= 1
        codeBtnText.value = `${count}s 后重试`
        if (count <= 0 && codeTimer) {
          clearInterval(codeTimer)
          codeTimer = null
          codeBtnText.value = '获取验证码'
          codeBtnDisabled.value = false
        }
      }, 1000)
      return
    }
    message.error(res.data.message || '验证码发送失败')
  } catch {
    message.error('验证码发送失败')
  }

  codeBtnDisabled.value = false
  codeBtnText.value = '获取验证码'
}
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

#userRegisterPage {
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

.email-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.form-link-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
  color: @text-secondary;
  font-size: 14px;
}
</style>
