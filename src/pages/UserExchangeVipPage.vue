<template>
  <div id="vipExchangePage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">容量与规格升级</h2>
        <p class="app-page__subtitle">输入兑换码升级工作台规格，继续扩容你的任务和结果处理能力。</p>
      </div>
    </section>

    <section class="app-form-card">
      <a-form name="formData" layout="vertical" :model="formData" @finish="handleSubmit">
        <a-form-item name="vipCode" label="兑换码">
          <a-input v-model:value="formData.vipCode" placeholder="请输入兑换码" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" style="width: 100%" :loading="loading">
            立即升级
          </a-button>
        </a-form-item>
      </a-form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { exchangeVipUsingPost } from '@/api/userController.ts'

const formData = reactive<API.VipExchangeRequest>({
  vipCode: '',
})
const loading = ref(false)
const router = useRouter()

const handleSubmit = async () => {
  if (!formData.vipCode) {
    message.error('请输入兑换码')
    return
  }

  loading.value = true
  try {
    const res = await exchangeVipUsingPost({
      vipCode: formData.vipCode,
    })

    if (res.data.code === 0 && res.data.data) {
      message.success('升级成功')
      router.push({
        path: '/',
      })
      return
    }
    message.error('升级失败，' + res.data.message)
  } catch {
    message.error('升级失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>
