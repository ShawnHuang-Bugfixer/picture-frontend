<template>
  <div id="userRegisterPage">
    <h2 class="title">用户注册</h2>
    <div class="desc">欢迎注册 墨灵共绘</div>
    <a-form :model="formState" name="basic" autocomplete="off" @finish="handleSubmit">
      <a-form-item name="userAccount" :rules="[{ required: true, message: '请输入账号' }]">
        <a-input v-model:value="formState.userAccount" placeholder="请输入账号" />
      </a-form-item>
      <a-form-item
        name="userPassword"
        :rules="[
          { required: true, message: '请输入密码' },
          { min: 8, message: '密码长度不能小于 8 位' },
        ]"
      >
        <a-input-password v-model:value="formState.userPassword" placeholder="请输入密码" autocomplete="new-password" />
      </a-form-item>
      <a-form-item
        name="checkPassword"
        :rules="[
          { required: true, message: '请输入确认密码' },
          { min: 8, message: '确认密码长度不能小于 8 位' },
          { validator: validateCheckPassword, trigger: 'blur' }
        ]"
      >
        <a-input-password v-model:value="formState.checkPassword" placeholder="请输入确认密码" autocomplete="new-password" />
      </a-form-item>
      <a-form-item name="email" :rules="[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]">
        <a-input v-model:value="formState.email" placeholder="请输入邮箱" style="width: 60%" />
        <a-button style="margin-left: 8px" @click="handleSendCode" :disabled="codeBtnDisabled">{{ codeBtnText }}</a-button>
      </a-form-item>
      <a-form-item name="code" :rules="[{ required: true, message: '请输入验证码' }]">
        <a-input v-model:value="formState.code" placeholder="请输入验证码" style="width: 60%" />
      </a-form-item>
      <div class="tips">
        已有账号？
        <RouterLink to="/user/login">去登录</RouterLink>
      </div>
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%">注册</a-button>
      </a-form-item>
    </a-form>
    <SliderCaptcha
      :visible="showSlider"
      @success="onSliderSuccess"
      @close="onSliderClose"
    />
  </div>
</template>
<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { userRegisterUsingPost } from '@/api/userController.ts'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { message } from 'ant-design-vue'
import router from '@/router' // 用于接受表单输入的值
import { sendEmailCode, getSliderToken } from '@/api/emailCodeController'
import SliderCaptcha from '@/components/SliderCaptcha.vue'

// 用于接受表单输入的值
const formState = reactive<API.UserRegisterRequest>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
  email: '',
  code: '',
})

const loginUserStore = useLoginUserStore()

const codeBtnText = ref('获取验证码')
const codeBtnDisabled = ref(false)
let codeTimer: any = null

const showSlider = ref(false)
let sliderResolve: ((v: boolean) => void) | null = null

const validateCheckPassword = (_rule: any, value: string) => {
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

/**
 * 提交表单
 * @param values
 */
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
  // 注册成功，跳转到登录页面
  if (res.data.code === 0 && res.data.data) {
    message.success('注册成功')
    router.push({
      path: '/user/login',
      replace: true,
    })
  } else {
    message.error('注册失败，' + res.data.message)
  }
}

const showSliderCaptcha = () => {
  showSlider.value = true
  return new Promise<boolean>((resolve) => {
    sliderResolve = resolve
  })
}
const onSliderSuccess = () => {
  showSlider.value = false
  sliderResolve && sliderResolve(true)
}
const onSliderClose = () => {
  showSlider.value = false
  sliderResolve && sliderResolve(false)
}

const handleSendCode = async () => {
  if (!formState.email) {
    message.error('请输入邮箱')
    return
  }
  // 1. 弹出滑块拼图
  const sliderResult = await showSliderCaptcha()
  if (!sliderResult) {
    message.error('请先通过滑块验证')
    return
  }
  // 2. 获取一次性 token
  const tokenRes = await getSliderToken()
  if (tokenRes.data.code !== 0 || !tokenRes.data.data) {
    message.error('获取滑块token失败')
    return
  }
  // 3. 正常请求验证码
  codeBtnDisabled.value = true
  codeBtnText.value = '发送中...'
  try {
    const res = await sendEmailCode(formState.email)
    if (res.data.code === 0 && res.data.data) {
      message.success('验证码已发送，请查收邮箱')
      let count = 60
      codeBtnText.value = `${count}s后重试`
      codeTimer = setInterval(() => {
        count--
        codeBtnText.value = `${count}s后重试`
        if (count <= 0) {
          clearInterval(codeTimer)
          codeBtnText.value = '获取验证码'
          codeBtnDisabled.value = false
        }
      }, 1000)
    } else {
      message.error(res.data.message || '验证码发送失败')
      codeBtnDisabled.value = false
      codeBtnText.value = '获取验证码'
    }
  } catch (e) {
    message.error('验证码发送失败')
    codeBtnDisabled.value = false
    codeBtnText.value = '获取验证码'
  }
}
</script>

<style scoped>
#userRegisterPage {
  max-width: 360px;
  margin: 0 auto;
}

.title {
  text-align: center;
  margin-bottom: 16px;
}

.desc {
  text-align: center;
  color: #bbb;
  margin-bottom: 16px;
}

.tips {
  color: #bbb;
  text-align: right;
  font-size: 13px;
  margin-bottom: 16px;
}
</style>
