<template>
  <div id="addPictureBatchPage" class="app-page">
    <section class="app-page__hero">
      <div>
        <h2 class="app-page__title">批量任务提交</h2>
        <p class="app-page__subtitle">通过关键词抓取批量导入素材，统一落入你的任务链路中。</p>
      </div>
    </section>

    <section class="app-form-card">
      <a-form name="formData" layout="vertical" :model="formData" @finish="handleSubmit">
        <a-form-item name="searchText" label="关键词">
          <a-input v-model:value="formData.searchText" placeholder="请输入抓取关键词" allow-clear />
        </a-form-item>
        <a-form-item name="count" label="抓取数量">
          <a-input-number
            v-model:value="formData.count"
            placeholder="请输入数量"
            style="width: 100%"
            :min="1"
            :max="30"
          />
        </a-form-item>
        <a-form-item name="namePrefix" label="名称前缀">
          <a-input v-model:value="formData.namePrefix" placeholder="会自动补齐序号" allow-clear />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" style="width: 100%" :loading="loading">
            执行任务
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
import { uploadPictureByBatchUsingPost } from '@/api/pictureController.ts'

const formData = reactive<API.PictureUploadByBatchRequest>({
  count: 10,
})
const loading = ref(false)
const router = useRouter()

const handleSubmit = async () => {
  loading.value = true
  try {
    const res = await uploadPictureByBatchUsingPost(
      {
        ...formData,
      },
      {
        timeout: 300000,
      },
    )

    if (res.data?.code === 0 && res.data?.data !== undefined) {
      message.success(`批量创建成功，共 ${res.data.data} 条`)
      router.push({
        path: '/',
      })
      return
    }
    message.error('批量创建失败，' + (res.data?.message || '未知错误'))
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '网络或服务错误'
    message.error('请求失败：' + errorMessage)
  } finally {
    loading.value = false
  }
}
</script>
